// @ts-check

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

// Import taste-skill palettes.
// The skill lives in .opencode/ which is gitignored, so the build must read
// the committed copy in src/resources/ — GitHub Actions never sees .opencode/.
const PALETTE_PATHS = [
  path.resolve('src/resources/palettes.json'),
  path.resolve('.opencode/skills/taste-skill/library/palettes.json'),
];
const palettePath = PALETTE_PATHS.find((p) => fs.existsSync(p));
if (!palettePath) {
  throw new Error(`No palette library found. Looked in:\n  ${PALETTE_PATHS.join('\n  ')}`);
}
const PALS = JSON.parse(fs.readFileSync(palettePath, 'utf8'));

// Import icon resolver from taste-skill
const { fetchIcon } = require('./utils/icons');
// Import vice components
const {
  Badge,
  SocialButton,
  SkillPill,
  RepoCard,
  FollowerCard,
  StatsCard,
  MetricsPanel,
  CategoryWall,
  BentoGrid,
  LawPanel,
  ActivityPanel,
  ProjectsGrid,
  FollowerButton,
  FollowerPanel,
  BentoBoard,
  BadgeRow,
  SocialRow,
} = require('./vice-components');
const { getRecentEvents, timeAgo } = require('./replacers/recentworks.js');
const { toTopicUrl } = require('./utils/skills');
const { textToPathStrings } = require('./vice-components');
const data = require('./data.js');
const { getRandomFollower } = require('./utils/githubApi');
const replacers = fs
  .readdirSync('./src/replacers')
  .filter((file) => file.endsWith('js'))
  .reduce((acc, cur) => {
    const replacerName = cur.slice(0, -3);
    try {
      acc[replacerName] = require('./replacers/' + cur);
    } catch (error) {
      console.error(`Error loading replacer ${replacerName}:`, error);
    }
    return acc;
  }, {});

const SOURCE_PATH = path.resolve('readme.source.md');
const OUTPUT_PATH = path.resolve('README.md');
const ASSETS_DIR = path.resolve('.github/assets');

const VICE_BLOCK_RE = /```vice\s*([\s\S]*?)\s*```/g;

const GITHUB_USER = process.env.GITHUB_USER || 'Thomashighbaugh';

// Accounts whose repositories are rolled into the account statistics.
const ORGS = ['Sanatana-Linux', 'TLH-Deprecated-Linux-Configurations'];
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

// Deal a palette for the software profile kind (saas/devtool trade).
// The choice is deterministic: a random palette would repaint every SVG on each
// daily Action run and commit hundreds of cache-busted files for no reason.
function dealPalette() {
  const palettes = PALS.filter(p =>
    p.trades && p.trades.includes('saas') && p.trades.includes('devtool')
  );
  const light = palettes.filter(p => p.tags && p.tags.includes('light-neutral'));
  const pool = light.length ? light : palettes;
  const seed = hashCode(GITHUB_USER) % pool.length;
  return pool[Math.abs(seed)];
}

/**
 * Stable small hash for deterministic picks.
 * @param {string} str
 * @returns {number}
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function resolvePath(obj, dotted) {
  const parts = String(dotted).match(/'[^']+'|[^.]+/g) || [];
  return parts.reduce((acc, key) => {
    const clean = key.startsWith("'") ? key.slice(1, -1) : key;
    return acc == null ? acc : acc[clean];
  }, obj);
}

function resolveDimension(value, item) {
  if (typeof value === 'number') return value;
  if (value === undefined || value === null || value === '') return undefined;
  const p = String(value).startsWith('item.') ? value.slice(5) : value;
  const resolved = resolvePath(item ?? {}, p);
  return typeof resolved === 'number' ? resolved : undefined;
}

function resolveLink(link, item) {
  if (!link) return null;
  if (link.startsWith('item.')) {
    const resolved = resolvePath(item ?? {}, link.slice(5));
    return typeof resolved === 'string' && resolved ? resolved : null;
  }
  return link;
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Parse a vice JSX block to extract component name and props.
 */
function parseJsxBlock(jsxContent, context) {
  const nameMatch = jsxContent.match(/<(\w+)/);
  if (!nameMatch) return null;
  const componentName = nameMatch[1];

  const props = {};
  const propRegex = /(\w+)=("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|(\d+)|\{([^}]+)\})/g;
  let match;
  while ((match = propRegex.exec(jsxContent)) !== null) {
    const propName = match[1];
    const rawValue = match[2];
    let resolved;
    if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
      resolved = rawValue.slice(1, -1);
    } else if (/^\d+$/.test(rawValue)) {
      resolved = parseInt(rawValue, 10);
    } else if (rawValue.startsWith('{')) {
      const expr = rawValue.slice(1, -1).trim();
      resolved = resolveExpr(expr, context);
    } else {
      resolved = rawValue;
    }    props[propName] = resolved;
  }

  return { componentName, props };
}

function resolveExpr(expr, context) {
  const raw = String(expr).trim();

  // Parenthesised expression: (github?.languages || [])
  if (isWrappedInParens(raw)) {
    return resolveExpr(raw.slice(1, -1), context);
  }

  // Numeric literal: size={100}
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);

  // String literal: 'dflt' or "dflt"
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
    return raw.slice(1, -1);
  }

  // Boolean/null literal
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;

  // Array literal: []
  if (raw === '[]') return [];

  // Optional chaining: item?.name → treat `?.` as a plain path separator.
  const path = raw.replace(/\?\./g, '.');

  // Method call on a resolved expression: (github?.languages || []).slice(0, 6)
  // The target may itself contain `||`, so match the trailing `.method(args)`
  // and resolve the target separately.
  const callMatch = path.match(/^(.*)\.([A-Za-z_$][\w$]*)\((.*)\)$/);
  if (callMatch) {
    const [, target, method, argsRaw] = callMatch;
    const targetValue = resolveExpr(target, context);
    const args = splitTopLevel(argsRaw, ',')
      .map((a) => resolveExpr(a, context))
      .filter((a) => a !== undefined);
    const methodFn = targetValue == null ? null : targetValue[method];
    if (typeof methodFn === 'function') {
      return methodFn.apply(targetValue, args);
    }
    return undefined;
  }

  // `a || b` — the left side wins when it is truthy, otherwise the right side.
  // Split on the top-level `||` only (not inside brackets or strings).
  const orParts = splitTopLevel(raw, '||');
  if (orParts.length > 1) {
    for (const part of orParts) {
      const value = resolveExpr(part, context);
      if (value !== undefined && value !== null && value !== '' && value !== 0 && value !== false) {
        return value;
      }
    }
    return resolveExpr(orParts[orParts.length - 1], context);
  }

  // Path lookup against the context: item.label, github.stats.totalStars
  if (path.startsWith('item.')) {
    return resolvePath(context.item ?? {}, path.slice(5));
  }
  return resolvePath(context, path);
}

/**
 * True when the whole expression is wrapped in a single matching pair of
 * parentheses — `(a || b)` is wrapped, `(a) || (b)` is not.
 */
function isWrappedInParens(input) {
  if (!input.startsWith('(') || !input.endsWith(')')) return false;
  let depth = 0;
  let quote = null;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      if (ch === quote && input[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i === input.length - 1;
    }
  }
  return false;
}

/**
 * Split a string on a separator that appears at the top level only —
 * not inside brackets, parentheses, or string literals.
 */
function splitTopLevel(input, separator) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = '';

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (quote) {
      current += ch;
      if (ch === quote && input[i - 1] !== '\\') quote = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if (ch === ')' || ch === ']' || ch === '}') depth--;

    if (depth === 0 && input.startsWith(separator, i)) {
      parts.push(current);
      current = '';
      i += separator.length - 1;
      continue;
    }

    current += ch;
  }

  parts.push(current);
  return parts.map((p) => p.trim()).filter((p) => p !== '');
}

function parseSource(source, assetDir = '.github/assets', sourcePath = 'README.md', assetsUrl = './.github/assets') {
  const blocks = [];
  let blockIndex = 0;

  // The asset URL is resolved by the caller (a raw.githubusercontent base in
  // production) — relative paths do not work on github.com.
  const relAssets = assetsUrl;
  void assetDir;
  void sourcePath;

  let match;
  let lastIndex = 0;
  let result = '';

  while ((match = VICE_BLOCK_RE.exec(source)) !== null) {
    const [fullMatch, content] = match;
    const metaMatch = fullMatch.match(/```vice\s*(.*?)\n/);
    const meta = metaMatch ? metaMatch[1].trim() : undefined;

    const firstNewline = content.indexOf('\n');
    const jsxContent = firstNewline !== -1 ? content.slice(firstNewline + 1) : '';

    blocks.push({ index: blockIndex, content: jsxContent.trim(), meta });

    result += source.slice(lastIndex, match.index);
    result += `<!-- __VICE_BLOCK_${blockIndex}__ -->\n`;

    lastIndex = match.index + fullMatch.length;
    blockIndex++;
  }

  result += source.slice(lastIndex);
  return { markdown: result, blocks, relAssets };
}

async function githubRequest(url, token = null) {
  const headers = { 'User-Agent': 'vice-build', Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`);
  return res.json();
}

async function fetchProfileViews(username) {
  try {
    const res = await fetch(
      `https://komarev.com/ghpvc/?username=${username}&style=for-the-badge&color=3c3c3c`,
      { headers: { 'User-Agent': 'vice-build' } },
    );
    if (!res.ok) return null;
    const svg = await res.text();
    const match = svg.match(/PROFILE VIEWS:\s*([\d,]+)/i);
    if (!match) return null;
    return match[1];
  } catch {
    return null;
  }
}

async function fetchTotalCommits(username, token) {
  if (!token) return null;
  const query = `
    query ($login: String!) {
      user(login: $login) {
        repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
          nodes { defaultBranchRef { target { ... on Commit { history { totalCount } } } } }
        }
      }
    }
  `;
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'vice-build' },
      body: JSON.stringify({ query, variables: { login: username } }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) return null;
    const nodes = json?.data?.user?.repositories?.nodes || [];
    return nodes.reduce((sum, node) => sum + (node?.defaultBranchRef?.target?.history?.totalCount ?? 0), 0);
  } catch {
    return null;
  }
}

async function fetchContext() {
  const [user, repos, starred, profileViews, follower, orgRepoLists, activity] = await Promise.all([
    githubRequest(`https://api.github.com/users/${GITHUB_USER}`, GITHUB_TOKEN),
    githubRequest(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated&direction=desc`, GITHUB_TOKEN),
    githubRequest(`https://api.github.com/users/${GITHUB_USER}/starred?per_page=30&sort=created&direction=desc`, GITHUB_TOKEN),
    fetchProfileViews(GITHUB_USER),
    getRandomFollower(GITHUB_USER, GITHUB_TOKEN).catch(() => null),
    Promise.all(
      ORGS.map((org) =>
        githubRequest(`https://api.github.com/orgs/${org}/repos?per_page=100&sort=updated`, GITHUB_TOKEN).catch(() => []),
      ),
    ),
    getRecentEvents(GITHUB_USER, GITHUB_TOKEN).catch(() => []),
  ]);

  const personalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const personalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const totalCommits = (await fetchTotalCommits(GITHUB_USER, GITHUB_TOKEN)) ?? 0;

  // One row per account, so the organisations appear in the statistics.
  const scopes = [
    { name: GITHUB_USER, repos: repos.length, stars: personalStars, forks: personalForks },
    ...ORGS.map((name, i) => {
      const list = orgRepoLists[i] || [];
      return {
        name,
        repos: list.length,
        stars: list.reduce((sum, r) => sum + (r.stargazers_count || 0), 0),
        forks: list.reduce((sum, r) => sum + (r.forks_count || 0), 0),
      };
    }),
  ];
  const allRepos = scopes.reduce((n, s) => n + s.repos, 0);
  const totalStars = scopes.reduce((n, s) => n + s.stars, 0);
  const totalForks = scopes.reduce((n, s) => n + s.forks, 0);

  const orgRepos = orgRepoLists.flat();
  const langCount = {};
  for (const repo of [...repos, ...orgRepos]) {
    if (repo.language) langCount[repo.language] = (langCount[repo.language] || 0) + 1;
  }
  const languages = Object.entries(langCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const starredRepos = starred
    .map((s) => s.repo || s)
    .filter((r) => r && !r.fork && (r.stargazers_count || 0) > 0)
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 6)
    .map((r) => ({
      name: r.name, fullName: r.full_name, description: r.description || '',
      stars: r.stargazers_count || 0, forks: r.forks_count || 0,
      language: r.language || '', languageColor: '', href: r.html_url, alt: r.full_name || r.name,
    }));

  return {
    github: { user: { login: user.login, name: user.name, avatarUrl: user.avatar_url, bio: user.bio || '', followers: user.followers || 0, publicRepos: user.public_repos || 0, htmlUrl: user.html_url }, stats: { totalStars, totalForks, totalRepos: allRepos, totalCommits }, scopes, languages, starredRepos },
    activity: (activity || []).map((e) => ({ action: e.action, repo: e.repo, detail: e.detail, ago: timeAgo(e.date) })),
    profileViews,
    follower: follower ? { login: follower.login, name: follower.name || follower.login, avatarUrl: follower.avatar_url, bio: follower.bio || '', publicRepos: follower.public_repos || 0, followers: follower.followers || 0, htmlUrl: follower.html_url, createdAt: follower.created_at } : null,  };
}

async function fetchAllIcons() {
  const icons = {};
  for (const badge of data.header.badges) {
    if (badge.logo) icons[`header:${badge.logo}`] = await fetchIcon(badge.logo, 'ffffff');
  }
  for (const link of data.socialMedias.links) {
    if (link.logo) icons[`social:${link.logo}`] = await fetchIcon(link.logo, 'ffffff');
  }
  const skillSlugs = new Set();
  for (const category of data.skillswall.categories) {
    for (const skill of category.skills) {
      const slug = skill.logo || skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!skillSlugs.has(slug)) {
        skillSlugs.add(slug);
        icons[`skill:${slug}`] = await fetchIcon(slug, 'ffffff');
      }
    }
  }
  return icons;
}

function buildLinkables(profileViews, icons = {}) {
  const viewsValue = profileViews ?? 'n/a';

  let viewsBadge = null;
  const headerBadges = [];
  for (const badge of data.header.badges) {
    const isViews = badge.type === 'views';
    const label = isViews ? 'Profile Views' : badge.name;
    const value = isViews ? viewsValue : '';
    const icon = badge.logo ? icons[`header:${badge.logo}`] : null;
    const entry = { type: badge.type, label, value, href: badge.href || null, icon, alt: label };
    // The views counter is rendered on its own in the Links panel.
    if (isViews) viewsBadge = entry;
    else headerBadges.push(entry);
  }

  const socialLinks = data.socialMedias.links.map((link) => {
    const icon = link.logo ? icons[`social:${link.logo}`] : null;
    // No width: the button measures its own label with the real font metrics.
    return { text: link.name, href: link.href, icon, alt: link.name };
  });

  const skillPills = {};
  for (const category of data.skillswall.categories) {
    skillPills[category.name] = category.skills.map((skill) => {
      const slug = skill.logo || skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const icon = icons[`skill:${slug}`];
      return { name: skill.name, icon, highlighted: Boolean(skill.isHighlighted), href: toTopicUrl(skill.name), alt: skill.name };
    });
  }

  // Grouped form for the bento grid: one entry per category, pills included.
  const skillGroups = data.skillswall.categories.map((category) => ({
    label: category.name,
    items: skillPills[category.name] || [],
  }));

  return { headerBadges, viewsBadge, socialLinks, skillPills, skillGroups };
}

async function build() {
  await fs.promises.mkdir(ASSETS_DIR, { recursive: true });

  console.log(`  GitHub: @${GITHUB_USER}`);
  let context = {};
  try {
    context = await fetchContext();
    console.log(`  Fetched: ${context.github.stats.totalRepos} repos, ${context.github.stats.totalStars} stars, ${context.github.languages.length} languages`);
  } catch (err) {
    console.warn(`  Warning: GitHub API failed: ${(err && err.message) || err}`);
    console.warn('  Using empty context — blocks with dynamic data will show fallbacks.\n');
  }

  console.log('  Palette:  dealing from taste-skill library...');
  const palette = dealPalette();
  console.log(`  Palette:  ${palette.name} (${palette.id}) — ${palette.bg} / ${palette.ink} / ${palette.accent}`);

  console.log('  Icons:  pre-fetching Simple Icons...');
  const icons = await fetchAllIcons();
  const iconCount = Object.values(icons).filter(Boolean).length;
  console.log(`  Icons:  ${iconCount} of ${Object.keys(icons).length} fetched`);

  const linkables = buildLinkables(context.profileViews, icons);
  context = {
    github: null, profileViews: null, follower: null,
    ...context, ...linkables,
    palette, textToPathStrings,
  };

  // The follower card renders a brand mark, not the raster avatar: the README
  // must stay free of raster <image> data.
  if (context.follower && !context.follower.icon) {
    context.follower.icon = await fetchIcon('github', '6AB0F3');
  }

  const source = fs.readFileSync(SOURCE_PATH, 'utf-8');
  const { markdown, blocks, relAssets } = parseSource(source, ASSETS_DIR, OUTPUT_PATH, 'https://raw.githubusercontent.com/Thomashighbaugh/Thomashighbaugh/main/.github/assets');
  console.log(`  Source: ${SOURCE_PATH}`);
  console.log(`  Blocks: ${blocks.length} vice block(s) found`);

  if (blocks.length === 0) {
    fs.writeFileSync(OUTPUT_PATH, markdown, 'utf-8');
    console.log(`\n  Generated: ${OUTPUT_PATH}\n`);
    return;
  }

  const COMPONENT_MAP = {
    Badge, SocialButton, SkillPill,
    RepoCard, FollowerCard, StatsCard,
    MetricsPanel, CategoryWall, BentoGrid, LawPanel, ActivityPanel, ProjectsGrid, FollowerButton, FollowerPanel, BentoBoard, BadgeRow, SocialRow,
  };

  const writtenFiles = [];
  const blockHtml = new Map();
  const blockSuffix = new Map();

  for (const block of blocks) {
    const meta = parseMeta(block.meta);
    const resolved = meta.from ? resolvePath(context, meta.from) : null;
    const items = Array.isArray(resolved) ? resolved : resolved ? [resolved] : [null];

    const htmlParts = [];

    if (meta.merge) {
      const parsed = parseJsxBlock(block.content, context);
      if (!parsed) {
        console.error(`\n  Error: cannot parse JSX in merge block ${block.index}\n`);
        process.exit(1);
      }
      const { componentName, props: jsxProps } = parsed;
      const Comp = COMPONENT_MAP[componentName];
      if (!Comp) {
        console.error(`\n  Error: unknown component "${componentName}" in merge block ${block.index}\n`);
        process.exit(1);
      }

      const width = resolveDimension(meta.width, { items }) || 800;
      const height = resolveDimension(meta.height, { items });

      // jsxProps may carry `items={item.items}` from the source template, which
      // is undefined in merge mode — the merged list is the source of truth.
      const mergedProps = { ...jsxProps };
      delete mergedProps.items;

      const svg = Comp({ ...mergedProps, items, width, ...(height ? { height } : {}), pillHeight: 30 });
      const hash = createHash('sha256').update(svg).digest('hex').slice(0, 8);
      const filename = `vice-component-${block.index}-${hash}.svg`;
      fs.writeFileSync(path.join(ASSETS_DIR, filename), svg, 'utf-8');
      writtenFiles.push(filename);

      const dims = svgDimensions(svg);
      const altText = meta.alt || `vice-${block.index}`;
      const imgTag = `<img src="${relAssets}/${filename}" width="${dims.width}" height="${dims.height}" alt="${escapeAttr(altText)}" />`;
      const href = resolveLink(meta.link, { items });
      htmlParts.push(href ? `<a href="${escapeAttr(href)}">${imgTag}</a>` : imgTag);

      if (meta.links) {
        blockSuffix.set(block.index, linkListHtml(items, meta.linksLabel));
      }
      console.log(`    [${block.index}] Rendered -> ${filename} (${dims.width}x${dims.height}) [merge=${items.length} items]`);
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i] ?? null;
        const itemContext = { ...context, item };

        // Dimensions come from the rendered SVG itself (svgDimensions), so the
        // block meta width/height are not needed here.

        const parsed = parseJsxBlock(block.content, itemContext);
        if (!parsed) {
          console.error(`\n  Error: cannot parse JSX in block ${block.index}\n`);
          process.exit(1);
        }
        const { componentName, props: jsxProps } = parsed;
        let Comp = COMPONENT_MAP[componentName];
        if (!Comp && block.content.match(/<(\w+)/)) {
          const allComponents = block.content.match(/<(\w+)/g);
          for (const m of allComponents) {
            const cn = m.slice(1);
            if (COMPONENT_MAP[cn]) {
              Comp = COMPONENT_MAP[cn];
              break;
            }
          }
        }
        if (!Comp) {
          console.error(`\n  Error: unknown component "${componentName}" in block ${block.index}\n`);
          process.exit(1);
        }

        const props = { ...item, ...context, ...jsxProps };
        const svg = Comp(props);
        const hash = createHash('sha256').update(svg).digest('hex').slice(0, 8);
        let filename = `vice-component-${block.index}-${hash}.svg`;
        if (writtenFiles.includes(filename)) {
          filename = `vice-component-${block.index}-${i}-${hash}.svg`;
        }
        fs.writeFileSync(path.join(ASSETS_DIR, filename), svg, 'utf-8');
        writtenFiles.push(filename);

        const alt = meta.alt || (item && (item.alt || item.name || item.text || item.login)) || `vice-${block.index}`;
        const dims = svgDimensions(svg);
        const imgTag = `<img src="${relAssets}/${filename}" width="${dims.width}" height="${dims.height}" alt="${escapeAttr(alt)}" />`;
        const href = resolveLink(meta.link, item);
        htmlParts.push(href ? `<a href="${escapeAttr(href)}">${imgTag}</a>` : imgTag);

        // A caption renders beneath the image as its own clickable line.
        if (meta.caption) {
          const captionText = resolveExpr(meta.caption, itemContext);
          if (captionText) {
            const label = `@${escapeAttr(String(captionText))}`;
            const captionHtml = href ? `<a href="${escapeAttr(href)}">${label}</a>` : label;
            htmlParts.push(`<br />${captionHtml}`);
          }
        }

        if (meta.links) {
          blockSuffix.set(block.index, linkListHtml(items, meta.linksLabel));
        }

        if (meta.linkDetails) {
          blockSuffix.set(block.index, linkDetailsHtml(context, meta.linkDetailsLabel));
        }

        if (meta.followerLink && context.follower && context.follower.htmlUrl) {
          const login = context.follower.login || 'profile';
          blockSuffix.set(
            block.index,
            `<p align="center"><a href="${escapeAttr(context.follower.htmlUrl)}">@${escapeAttr(login)}</a></p>`,
          );
        }

        console.log(`    [${block.index}] Rendered -> ${filename} (${dims.width}x${dims.height})`);
      }
    }

    // GitHub strips CSS from READMEs, so spacing between inline images has to
    // come from markup. Non-breaking spaces give a real gap without touching
    // the image itself (GitHub paints a background behind every <img>).
    const gap = '&nbsp;'.repeat(meta.gap || 0);
    blockHtml.set(block.index, htmlParts.join(gap));
  }

  let finalMd = markdown;
  for (const block of blocks) {
    const html = blockHtml.get(block.index) || '';
    const suffix = blockSuffix.get(block.index) || '';
    finalMd = finalMd.replace(`<!-- __VICE_BLOCK_${block.index}__ -->`, `<p align="center">${html}</p>${suffix}`);
  }

  const replacementRegex = new RegExp(`%{(${Object.keys(replacers).join('|')})}`, 'gm');
  async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
      const promise = asyncFn(match, ...args);
      promises.push(promise);
    });
    const resolved = await Promise.all(promises);
    return str.replace(regex, () => resolved.shift());
  }

  finalMd = await replaceAsync(finalMd, replacementRegex, async (tag) => {
    const replacerName = tag.slice(2, -1);
    if (replacers[replacerName]) {
      return await replacers[replacerName](data);
    }
    console.warn(`No replacer found for tag: ${tag}`);
    return tag;
  });

  fs.writeFileSync(OUTPUT_PATH, finalMd, 'utf-8');
  console.log(`\n  Generated: ${OUTPUT_PATH}`);
  console.log(`  SVGs saved to: ${ASSETS_DIR}\n`);

  const generatedPattern = /^vice-component-\d+-[\w]+\.svg$/;
  try {
    const existing = await fs.promises.readdir(ASSETS_DIR);
    for (const name of existing) {
      if (generatedPattern.test(name) && !writtenFiles.includes(name)) {
        await fs.promises.unlink(path.join(ASSETS_DIR, name));
      }
    }
  } catch {
    // Stale asset cleanup is best-effort
  }

  console.log('  Gate:   running taste-skill finish gate...');
  try {
    const { execSync } = require('node:child_process');
    const gateResult = execSync(
      `node scripts/gate.mjs ${OUTPUT_PATH} --kind software --category "agentic coding profile" --primary "View profile" --quick --profile .taste-skill/chrome-taste`,
      { stdio: 'inherit', cwd: path.resolve('.opencode/skills/taste-skill') }
    );
    console.log(`  Gate:   ${gateResult.stdout || 'complete'}`);
  } catch (err) {
    console.warn(`  Warning: Gate check failed: ${err.message}`);
    console.warn('  Build continues — review gate output above.');
  }
}

if (require.main === module) {
  build().catch((err) => {
    console.error('Vice build failed:', err);
    process.exit(1);
  });
}

/**
 * Read the intrinsic width and height of a rendered SVG.
 * The <img> tag must match the SVG exactly or the browser scales it and the
 * layout drifts.
 *
 * @param {string} svg
 * @returns {{width: number, height: number}}
 */
function svgDimensions(svg) {
  const open = svg.match(/<svg\b[^>]*>/);
  if (!open) return { width: 0, height: 0 };
  const w = open[0].match(/\bwidth="([\d.]+)"/);
  const h = open[0].match(/\bheight="([\d.]+)"/);
  return {
    width: w ? Math.round(Number(w[1])) : 0,
    height: h ? Math.round(Number(h[1])) : 0,
  };
}

/**
 * One collapsed <details> holding the follower's profile and every project the
 * board shows. Both change daily, so the list is derived from the same context
 * that rendered the cards.
 *
 * @param {object} context
 * @param {string} [label]
 * @returns {string}
 */
function linkDetailsHtml(context, label = 'Links') {
  const follower = context.follower;
  const repos = (context.github && context.github.starredRepos) || [];

  const parts = [];

  if (follower && follower.htmlUrl) {
    const handle = follower.login || follower.name || 'profile';
    parts.push(
      `<p align="center"><strong>Follower of the day</strong><br />` +
        `<a href="${escapeAttr(follower.htmlUrl)}">@${escapeAttr(handle)}</a></p>`,
    );
  }

  const repoRows = repos
    .filter((r) => r && r.href)
    .map((r) => {
      const text = r.fullName || r.name || r.href;
      return `<li><a href="${escapeAttr(r.href)}">${escapeAttr(text)}</a></li>`;
    });

  if (repoRows.length) {
    parts.push(
      `<p align="center"><strong>Projects I'm following</strong></p><ul>${repoRows.join('')}</ul>`,
    );
  }

  if (!parts.length) return '';
  return `<details><summary>${escapeAttr(label)}</summary>${parts.join('')}</details>`;
}

/**
 * Build a collapsed <details> list linking to every item a block rendered.
 *
 * It is emitted after the block's <p>, because a <details> is flow content and
 * cannot legally live inside a paragraph.
 *
 * @param {Array<object>} items
 * @param {string} [label] - summary text
 * @returns {string}
 */
function linkListHtml(items, label = 'Links to these projects') {
  const rows = (items || [])
    .filter((item) => item && (item.href || item.url))
    .map((item) => {
      const url = escapeAttr(item.href || item.url);
      const text = escapeAttr(item.fullName || item.name || item.text || item.login || url);
      return `<li><a href="${url}">${text}</a></li>`;
    });
  if (!rows.length) return '';
  return `<details><summary>${escapeAttr(label)}</summary><ul>${rows.join('')}</ul></details>`;
}

module.exports = { build, parseSource, resolveExpr, parseJsxBlock };

function parseMeta(meta) {
  // No height default: components size themselves, and a bogus default would
  // pad every auto-sized panel with empty space.
  const defaults = { width: 800 };
  if (!meta) return defaults;
  const pairs = [...meta.matchAll(/(\w+)=("[^"]*"|[^\s]+)/g)];
  for (const [, key, rawValue] of pairs) {
    const value = rawValue.startsWith('"') ? rawValue.slice(1, -1) : rawValue;
    if (key === 'width') defaults.width = /^\d+$/.test(value) ? parseInt(value, 10) : value;
    if (key === 'height') defaults.height = /^\d+$/.test(value) ? parseInt(value, 10) : value;
    if (key === 'link') defaults.link = value;
    if (key === 'from') defaults.from = value;
    if (key === 'gap') defaults.gap = /^\d+$/.test(value) ? parseInt(value, 10) : 0;
    if (key === 'alt') defaults.alt = value.replace(/^["']|["']$/g, '');
    if (key === 'caption') defaults.caption = value.replace(/^["']|["']$/g, '');
    if (key === 'linksLabel') defaults.linksLabel = value.replace(/^["']|["']$/g, '');
    if (key === 'linkDetailsLabel') defaults.linkDetailsLabel = value.replace(/^["']|["']$/g, '');
  }
  if (/\bmerge\b/.test(meta)) defaults.merge = true;
  // A bare `links` token asks for a <details> list of links beneath the image.
  if (/\blinks\b/.test(meta)) defaults.links = true;
  // A bare `followerLink` token emits the follower's profile link beneath the
  // image, keeping it reachable even when the card itself is inside a board.
  if (/\bfollowerLink\b/.test(meta)) defaults.followerLink = true;
  // `linkDetails` emits one collapsed block holding the follower and project links.
  if (/\blinkDetails\b/.test(meta)) defaults.linkDetails = true;
  return defaults;
}
