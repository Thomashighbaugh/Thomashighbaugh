// @ts-check

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

// Import taste-skill palettes
const PALS = JSON.parse(fs.readFileSync(
  path.resolve('.opencode/skills/taste-skill/library/palettes.json'), 'utf8'
));

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
} = require('./vice-components');
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
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

// Deal a palette for the software profile kind (saas/devtool trade)
function dealPalette() {
  const palettes = PALS.filter(p =>
    p.trades && p.trades.includes('saas') && p.trades.includes('devtool')
  );
  // Prefer light-neutral palettes for a profile README
  const light = palettes.filter(p => p.tags && p.tags.includes('light-neutral'));
  const pool = light.length ? light : palettes;
  return pool[Math.floor(Math.random() * pool.length)];
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
  const p = String(value).startsWith('item.') ? value.slice(5) : value;
  const resolved = resolvePath(item ?? {}, p);
  return typeof resolved === 'number' ? resolved : 800;
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
    }
    props[propName] = resolved;
  }

  return { componentName, props };
}

function resolveExpr(expr, context) {
  if (expr.startsWith('item.')) {
    return resolvePath(context.item ?? {}, expr.slice(5));
  }
  return context[expr];
}

function parseSource(source, assetsDir = '.github/assets', outputPath = 'README.md', assetsUrl = './.github/assets') {
  const blocks = [];
  let blockIndex = 0;

  const absAssets = path.resolve(assetsDir);
  const absOutput = path.resolve(outputPath);
  const relAssets = assetsUrl;

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
  const [user, repos, starred, profileViews, follower] = await Promise.all([
    githubRequest(`https://api.github.com/users/${GITHUB_USER}`, GITHUB_TOKEN),
    githubRequest(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated&direction=desc`, GITHUB_TOKEN),
    githubRequest(`https://api.github.com/users/${GITHUB_USER}/starred?per_page=30&sort=created&direction=desc`, GITHUB_TOKEN),
    fetchProfileViews(GITHUB_USER),
    getRandomFollower(GITHUB_USER, GITHUB_TOKEN).catch(() => null),
  ]);

  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const totalCommits = (await fetchTotalCommits(GITHUB_USER, GITHUB_TOKEN)) ?? 0;

  const langCount = {};
  for (const repo of repos) {
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
    github: { user: { login: user.login, name: user.name, avatarUrl: user.avatar_url, bio: user.bio || '', followers: user.followers || 0, publicRepos: user.public_repos || 0, htmlUrl: user.html_url }, stats: { totalStars, totalForks, totalRepos: repos.length, totalCommits }, languages, starredRepos },
    profileViews,
    follower: follower ? { login: follower.login, name: follower.name || follower.login, avatarUrl: follower.avatar_url, bio: follower.bio || '', publicRepos: follower.public_repos || 0, followers: follower.followers || 0, htmlUrl: follower.html_url, createdAt: follower.created_at } : null,
  };
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

  const headerBadges = data.header.badges.map((badge) => {
    const isViews = badge.type === 'views';
    const label = isViews ? 'Profile Views' : badge.name;
    const value = isViews ? viewsValue : badge.name;
    const icon = badge.logo ? icons[`header:${badge.logo}`] : null;
    return { type: badge.type, label, value, href: badge.href || null, icon, alt: label };
  });

  const socialLinks = data.socialMedias.links.map((link) => {
    const icon = link.logo ? icons[`social:${link.logo}`] : null;
    const iconSize = icon ? 18 + 8 : 0;
    return { text: link.name, href: link.href, icon, alt: link.name, width: Math.ceil(iconSize + link.name.length * 7.5 + 24) };
  });

  const skillPills = {};
  for (const category of data.skillswall.categories) {
    skillPills[category.name] = category.skills.map((skill) => {
      const slug = skill.logo || skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const icon = icons[`skill:${slug}`];
      return { name: skill.name, icon, highlighted: Boolean(skill.isHighlighted), href: toTopicUrl(skill.name), alt: skill.name };
    });
  }

  return { headerBadges, socialLinks, skillPills };
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
    MetricsPanel, CategoryWall,
  };

  const writtenFiles = [];
  const blockHtml = new Map();

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
      const height = resolveDimension(meta.height, { items }) || 300;

      const svg = Comp({ items, width, height, pillHeight: 24, ...jsxProps });
      const hash = createHash('sha256').update(svg).digest('hex').slice(0, 8);
      const filename = `vice-component-${block.index}-${hash}.svg`;
      fs.writeFileSync(path.join(ASSETS_DIR, filename), svg, 'utf-8');
      writtenFiles.push(filename);

      const imgTag = `<img src="${relAssets}/${filename}" width="${width}" height="${height}" alt="vice-${block.index}" />`;
      const href = resolveLink(meta.link, { items });
      htmlParts.push(href ? `<a href="${escapeAttr(href)}">${imgTag}</a>` : imgTag);
      console.log(`    [${block.index}] Rendered -> ${filename} (${width}x${height}) [merge=${items.length} items]`);
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i] ?? null;
        const itemContext = { ...context, item };

        const width = resolveDimension(meta.width, item);
        const height = resolveDimension(meta.height, item);

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

        const alt = (item && (item.alt || item.name || item.text || item.login)) || `vice-${block.index}`;
        const imgTag = `<img src="${relAssets}/${filename}" width="${width}" height="${height}" alt="${escapeAttr(alt)}" />`;
        const href = resolveLink(meta.link, item);
        htmlParts.push(href ? `<a href="${escapeAttr(href)}">${imgTag}</a>` : imgTag);
        console.log(`    [${block.index}] Rendered -> ${filename} (${width}x${height})`);
      }
    }

    blockHtml.set(block.index, htmlParts.join(''));
  }

  let finalMd = markdown;
  for (const block of blocks) {
    const html = blockHtml.get(block.index) || '';
    finalMd = finalMd.replace(`<!-- __VICE_BLOCK_${block.index}__ -->`, `<p align="center">${html}</p>`);
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

module.exports = { build, parseSource };

function parseMeta(meta) {
  const defaults = { width: 800, height: 400 };
  if (!meta) return defaults;
  const pairs = [...meta.matchAll(/(\w+)=("[^"]*"|[^\s]+)/g)];
  for (const [, key, rawValue] of pairs) {
    const value = rawValue.startsWith('"') ? rawValue.slice(1, -1) : rawValue;
    if (key === 'width') defaults.width = /^\d+$/.test(value) ? parseInt(value, 10) : value;
    if (key === 'height') defaults.height = /^\d+$/.test(value) ? parseInt(value, 10) : value;
    if (key === 'link') defaults.link = value;
    if (key === 'from') defaults.from = value;
  }
  if (/\bmerge\b/.test(meta)) defaults.merge = true;
  return defaults;
}
