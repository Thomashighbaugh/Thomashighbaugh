// @ts-check

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
// Node 18+ has global fetch; node-fetch v3 is ESM-only and incompatible with this CJS project

const { renderJsx, parseMeta, loadFonts } = require('./vice-renderer');
const {
  Badge,
  SocialButton,
  SkillPill,
  RepoCard,
  FollowerCard,
  StatsCard,
  MetricsPanel,
  skillPillWidth,
  badgeWidth,
} = require('./vice-components');
const { toTopicUrl, toSimpleIconsUrl } = require('./utils/skills');

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
const FONTS_DIR = path.resolve('src/resources/fonts');

const VICE_BLOCK_RE = /```vice\s*([\s\S]*?)\s*```/g;

const GITHUB_USER = process.env.GITHUB_USER || 'Thomashighbaugh';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

/**
 * Discover all outline font files (.woff2, .woff, .ttf, .otf) in the fonts dir.
 * Bitmap fonts (.fnt/.png Coder family) are excluded — Satori cannot use them.
 */
function discoverFonts() {
  if (!fs.existsSync(FONTS_DIR)) return [];
  return fs
    .readdirSync(FONTS_DIR, { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.isDirectory()) {
        return fs
          .readdirSync(path.join(FONTS_DIR, entry.name), { withFileTypes: true })
          .filter((f) => f.isFile() && /\.(woff2|woff|ttf|otf)$/i.test(f.name))
          .map((f) => path.join(FONTS_DIR, entry.name, f.name));
      }
      return /\.(woff2|woff|ttf|otf)$/i.test(entry.name) ? [path.join(FONTS_DIR, entry.name)] : [];
    })
    .sort();
}

/**
 * Resolve a dotted path against an object (e.g. `github.starredRepos`).
 * Quoted segments are supported for keys with spaces or punctuation:
 * `skillPills.'Backend & Databases'`.
 */
function resolvePath(obj, dotted) {
  const parts = String(dotted).match(/'[^']+'|[^.]+/g) || [];
  return parts.reduce((acc, key) => {
    const clean = key.startsWith("'") ? key.slice(1, -1) : key;
    return acc == null ? acc : acc[clean];
  }, obj);
}

/**
 * Resolve a dimension that may be a number or an `item.<prop>` expression.
 */
function resolveDimension(value, item) {
  if (typeof value === 'number') return value;
  const path = String(value).startsWith('item.') ? value.slice(5) : value;
  const resolved = resolvePath(item ?? {}, path);
  return typeof resolved === 'number' ? resolved : 800;
}

/**
 * Resolve the link target for a rendered item. A `link` value of the form
 * `item.<prop>` is read off the item; anything else is a static URL.
 */
function resolveLink(link, item) {
  if (!link) return null;
  if (link.startsWith('item.')) {
    const resolved = resolvePath(item ?? {}, link.slice(5));
    return typeof resolved === 'string' && resolved ? resolved : null;
  }
  return link;
}

/**
 * Escape a value for use inside an HTML attribute.
 */
function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Parse a vice source markdown file, extract ```vice blocks, and return
 * the markdown with blocks replaced by placeholders plus the block list.
 *
 * Each block becomes an HTML-comment placeholder. The rendered markup
 * (one <a><img></a> per item) is substituted in once the SVGs exist, so the
 * final markdown can carry per-item links.
 */
function parseSource(source, assetsDir = '.github/assets', outputPath = 'README.md') {
  const blocks = [];
  let blockIndex = 0;

  const absAssets = path.resolve(assetsDir);
  const absOutput = path.resolve(outputPath);
  const relAssets = './' + path.relative(path.dirname(absOutput), absAssets).replace(/\\/g, '/');

  let match;
  let lastIndex = 0;
  let result = '';

  while ((match = VICE_BLOCK_RE.exec(source)) !== null) {
    const [fullMatch, content] = match;
    const metaMatch = fullMatch.match(/```vice\s*(.*?)\n/);
    const meta = metaMatch ? metaMatch[1].trim() : undefined;

    // Strip the meta line (first line) from the JSX content
    const firstNewline = content.indexOf('\n');
    const jsxContent = firstNewline !== -1 ? content.slice(firstNewline + 1) : '';

    blocks.push({
      index: blockIndex,
      content: jsxContent.trim(),
      meta,
    });

    result += source.slice(lastIndex, match.index);
    result += `<!-- __VICE_BLOCK_${blockIndex}__ -->\n`;

    lastIndex = match.index + fullMatch.length;
    blockIndex++;
  }

  result += source.slice(lastIndex);

  return { markdown: result, blocks, relAssets };
}

/**
 * GitHub API request helper.
 */
async function githubRequest(url, token = null) {
  const headers = {
    'User-Agent': 'vice-build',
    Accept: 'application/vnd.github+json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`);
  return res.json();
}

/**
 * Fetch the profile view count from komarev's SVG badge.
 * The README is regenerated daily, so reading the number at build time and
 * rendering it into the SVG gives a live-enough counter without pointing the
 * rendered README at the ghpvc host (which was intermittently failing).
 *
 * @param {string} username
 * @returns {Promise<string|null>} formatted count, or null if unavailable
 */
async function fetchProfileViews(username) {
  try {
    const res = await fetch(
      `https://komarev.com/ghpvc/?username=${username}&style=for-the-badge&color=3c3c3c`,
      {
        headers: { 'User-Agent': 'vice-build' },
      },
    );
    if (!res.ok) return null;
    const svg = await res.text();
    // aria-label="PROFILE VIEWS: 5,998" / <title>PROFILE VIEWS: 5,998</title>
    const match = svg.match(/PROFILE VIEWS:\s*([\d,]+)/i);
    if (!match) return null;
    return match[1];
  } catch {
    return null;
  }
}

/**
 * Fetch the total commit count across all public repos via the GraphQL API.
 * The REST events API does not expose commit counts, so GraphQL is the only
 * single-request way to get an exact number. Requires a token; returns null
 * when unavailable so the caller can fall back to 0.
 *
 * @param {string} username
 * @param {string|null} token
 * @returns {Promise<number|null>}
 */
async function fetchTotalCommits(username, token) {
  if (!token) return null;

  const query = `
    query ($login: String!) {
      user(login: $login) {
        repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
          nodes {
            defaultBranchRef {
              target {
                ... on Commit { history { totalCount } }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'vice-build',
      },
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

/**
 * Fetch GitHub user data, stats, and starred repos for JSX context.
 */
async function fetchContext() {
  const [user, repos, starred, profileViews, follower] = await Promise.all([
    githubRequest(`https://api.github.com/users/${GITHUB_USER}`, GITHUB_TOKEN),
    githubRequest(
      `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated&direction=desc`,
      GITHUB_TOKEN,
    ),
    githubRequest(
      `https://api.github.com/users/${GITHUB_USER}/starred?per_page=30&sort=created&direction=desc`,
      GITHUB_TOKEN,
    ),
    fetchProfileViews(GITHUB_USER),
    getRandomFollower(GITHUB_USER, GITHUB_TOKEN).catch(() => null),
  ]);

  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const totalCommits = (await fetchTotalCommits(GITHUB_USER, GITHUB_TOKEN)) ?? 0;

  const langCount = {};
  for (const repo of repos) {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1;
    }
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
      name: r.name,
      fullName: r.full_name,
      description: r.description || '',
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      language: r.language || '',
      languageColor: '', // resolved from LANGUAGE_COLORS by the component
      href: r.html_url,
      alt: r.full_name || r.name,
    }));

  return {
    github: {
      user: {
        login: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
        bio: user.bio || '',
        followers: user.followers || 0,
        publicRepos: user.public_repos || 0,
        htmlUrl: user.html_url,
      },
      stats: {
        totalStars,
        totalForks,
        totalRepos: repos.length,
        totalCommits,
      },
      languages,
      starredRepos,
    },
    profileViews,
    follower: follower
      ? {
          login: follower.login,
          name: follower.name || follower.login,
          avatarUrl: follower.avatar_url,
          bio: follower.bio || '',
          publicRepos: follower.public_repos || 0,
          followers: follower.followers || 0,
          htmlUrl: follower.html_url,
          createdAt: follower.created_at,
        }
      : null,
  };
}

/**
 * Build the clickable-item collections the vice blocks render one-per-file.
 *
 * Every entry carries its own `href` so the generated README can wrap each
 * rendered SVG in an <a> — an SVG loaded through <img> cannot contain its own
 * links, so one file per clickable element is the only way to keep them
 * clickable.
 *
 * @returns {{headerBadges: object[], socialLinks: object[], skillPills: Record<string, object[]>}}
 */
function buildLinkables(profileViews) {
  const viewsValue = profileViews ?? 'n/a';

  const headerBadges = data.header.badges.map((badge) => {
    const isViews = badge.type === 'views';
    const label = isViews ? 'Profile Views' : badge.name;
    const value = isViews ? viewsValue : badge.name;
    const logo = badge.logo ? `https://cdn.simpleicons.org/${badge.logo}/ffffff` : null;
    return {
      type: badge.type,
      label,
      value,
      href: badge.href || null,
      logo,
      alt: label,
      width: badgeWidth(label, value, logo, 'for-the-badge', 30),
    };
  });

  const socialLinks = data.socialMedias.links.map((link) => {
    const logo = link.logo ? `https://cdn.simpleicons.org/${link.logo}/ffffff` : null;
    // The button sizes itself to icon + gap + label + padding.
    const width = (logo ? 18 + 8 : 0) + link.name.length * 7.5 + 24;
    return {
      text: link.name,
      href: link.href,
      logo,
      alt: link.name,
      width: Math.ceil(width),
    };
  });

  /** @type {Record<string, object[]>} */
  const skillPills = {};
  for (const category of data.skillswall.categories) {
    skillPills[category.name] = category.skills.map((skill) => {
      const logo = toSimpleIconsUrl(skill.name, skill.logo);
      return {
        name: skill.name,
        logo,
        highlighted: Boolean(skill.isHighlighted),
        href: toTopicUrl(skill.name),
        alt: skill.name,
        width: skillPillWidth(skill.name, logo),
      };
    });
  }

  return { headerBadges, socialLinks, skillPills };
}

/**
 * Main build: parse source, render all vice blocks to SVG, write assets + README.
 */
async function build() {
  await fs.promises.mkdir(ASSETS_DIR, { recursive: true });

  // Load fonts from repo
  const fontPaths = discoverFonts();
  console.log(`  Fonts:  ${fontPaths.length} outline font(s) discovered in ${FONTS_DIR}`);
  const fonts = await loadFonts(fontPaths);

  // Fetch GitHub data for JSX context.
  // The built-in components are always bound — a failed API call must not
  // break rendering, only the dynamic values inside the blocks.
  console.log(`  GitHub: @${GITHUB_USER}`);
  let context = {};
  try {
    context = await fetchContext();
    console.log(
      `  Fetched: ${context.github.stats.totalRepos} repos, ${context.github.stats.totalStars} stars, ${context.github.languages.length} languages`,
    );
  } catch (err) {
    console.warn(`  Warning: GitHub API failed: ${(err && err.message) || err}`);
    console.warn('  Using empty context — blocks with dynamic data will show fallbacks.\n');
  }

  // Built-in vice components available in every vice block.
  // Every name referenced by a vice block is bound here — even to null.
  // Optional chaining (`github?.stats`) does not protect against an
  // *undeclared* identifier, it only guards null/undefined on a bound one.
  const linkables = buildLinkables(context.profileViews);
  context = {
    github: null,
    profileViews: null,
    follower: null,
    ...context,
    ...linkables,
    Badge,
    SocialButton,
    SkillPill,
    RepoCard,
    FollowerCard,
    StatsCard,
    MetricsPanel,
  };

  // Parse source
  const source = fs.readFileSync(SOURCE_PATH, 'utf-8');
  const { markdown, blocks, relAssets } = parseSource(source, ASSETS_DIR, OUTPUT_PATH);
  console.log(`  Source: ${SOURCE_PATH}`);
  console.log(`  Blocks: ${blocks.length} vice block(s) found`);

  if (blocks.length === 0) {
    console.log('\n  No vice blocks found in source file.');
    fs.writeFileSync(OUTPUT_PATH, markdown, 'utf-8');
    console.log(`\n  Generated: ${OUTPUT_PATH}\n`);
    return;
  }

  // Render each block to SVG.
  // A block with `from=<path>` renders one SVG per item in the resolved
  // collection, so every clickable element gets its own file and its own
  // <a href> wrapper. A block without it renders a single SVG.
  const writtenFiles = [];
  const blockHtml = new Map();

  for (const block of blocks) {
    const meta = parseMeta(block.meta);
    const resolved = meta.from ? resolvePath(context, meta.from) : null;
    const items = Array.isArray(resolved) ? resolved : resolved ? [resolved] : [null];

    const htmlParts = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i] ?? null;
      // `item` is always bound, even when null — optional chaining does not
      // guard an *undeclared* identifier.
      const itemContext = { ...context, item };

      const width = resolveDimension(meta.width, item);
      const height = resolveDimension(meta.height, item);

      let svg;
      try {
        svg = await renderJsx(block.content, width, height, fonts, itemContext);
      } catch (err) {
        console.error(`\n  Error rendering vice block ${block.index}: ${(err && err.message) || err}\n`);
        process.exit(1);
      }

      // Content-hashed filename for cache busting
      const hash = createHash('sha256').update(svg).digest('hex').slice(0, 8);
      let filename = `vice-component-${block.index}-${hash}.svg`;
      // Guard against two items rendering byte-identical SVGs.
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

    blockHtml.set(block.index, htmlParts.join(''));
  }

  // Substitute each block placeholder with its rendered markup.
  // Inline images flow side by side inside a centered paragraph, so a block
  // of N items lays out as a row (or wraps to more rows) on its own.
  let finalMd = markdown;
  for (const block of blocks) {
    const html = blockHtml.get(block.index) || '';
    finalMd = finalMd.replace(
      `<!-- __VICE_BLOCK_${block.index}__ -->`,
      `<p align="center">${html}</p>`,
    );
  }

  // Process remaining %{tag} template tags using existing replacers
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

  // Remove stale SVGs from previous builds (not in this build's writtenFiles)
  const generatedPattern = /^vice-component-\d+-[\w]+\.svg$/;
  try {
    const existing = await fs.promises.readdir(ASSETS_DIR);
    for (const name of existing) {
      if (generatedPattern.test(name) && !writtenFiles.includes(name)) {
        await fs.promises.unlink(path.join(ASSETS_DIR, name));
      }
    }
  } catch {
    // Assets dir may not exist yet on first run
  }
}

// Only run when executed directly. The mocha glob (`src/**/*.{js,jsx,ts,tsx}`)
// loads every file in src/ as a test file — without this guard, `npm test`
// would regenerate the README as a side effect.
if (require.main === module) {
  build().catch((err) => {
    console.error('Vice build failed:', err);
    process.exit(1);
  });
}

module.exports = { build, parseSource };
