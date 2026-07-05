// @ts-check

const theme = require('../theme');
const { generateBadge } = require('../utils/generateBadge');
const { generateElement } = require('../utils/generateElement');

/** @type {string[]} */
const wallColors = [theme.colors.primary, theme.colors.lightPrimary];

const highlightColor = theme.colors.primary;

/**
 * Map of skill names to specific GitHub topic slugs for edge cases.
 * Falls back to auto-slugify if no entry here.
 * @type {Record<string, string>}
 */
const TOPIC_MAP = {
  'BASH/ZSH': 'bash',
  'Node.JS': 'nodejs',
  'TSX': 'typescript',
  'MERN Stack': 'mern',
  'Visual Studio Code': 'vscode',
  'JetBrains IDEs': 'jetbrains',
  'Styled Components': 'styled-components',
  'Material-UI': 'material-ui',
  'TailwindCSS': 'tailwind-css',
  'Ant-Design': 'ant-design',
  'Chakra': 'chakra-ui',
  'GitHub Actions': 'github-actions',
  'NPM': 'npm',
  'Github Pages': 'github-pages',
};

/**
 * Normalize a skill name to a GitHub topic URL.
 * @param {string} name
 * @returns {string}
 */
function toTopicUrl(name) {
  const slug = TOPIC_MAP[name] || name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `https://github.com/topics/${encodeURIComponent(slug)}`;
}

/**
 * @param {{ isHighlighted?: boolean }} options
 * @returns {{ color: string, logoColor: string }}
 */
const getWallColor = (options = { isHighlighted: false }) => ({
  color: options.isHighlighted ? highlightColor : wallColors[Math.floor(Math.random() * wallColors.length)],
  logoColor: theme.colors.white,
});

/**
 * Encode a string for use in shields.io badge URLs.
 * @param {string} str
 * @param {string} replacer - character to replace '-' with
 * @returns {string}
 */
const encodeStr = (str, replacer) => {
  return encodeURI(str.toLowerCase().replace(/-/g, replacer));
};

/**
 * Fetch user repos from the GitHub API.
 * @param {string} username
 * @param {string|null} [token]
 * @returns {Promise<import('../types').GitHubRepo[]>}
 */
async function fetchUserRepos(username, token = null) {
  const headers = { 'User-Agent': 'skillswall-replacer' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated&direction=desc`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch repos: ${res.status}`);
  return await res.json();
}

/**
 * Skills wall replacer — renders categorized skill badges with links
 * to GitHub topic pages, plus dynamically detected languages from repos.
 * @type {import('../types').ReplacerFunction}
 */
module.exports = async function (data) {
  const skillswall = data.skillswall;
  const { user, token } = data;
  const { align, ...badgeGenericStyles } = skillswall.styles;

  // Render existing categories with href links to GitHub topics
  const categorySections = skillswall.categories.map(category => {
    const badges = category.skills.map(skill => {
      const name = encodeStr(skill.name, '_');
      const logo = encodeStr(skill.logo ?? skill.name, '+');
      const colors = getWallColor({ isHighlighted: skill.isHighlighted });
      const href = toTopicUrl(skill.name);
      return generateBadge({ name, logo, href, ...badgeGenericStyles, ...colors });
    }).join('\n');

    return `<strong>${category.name}:</strong><br>${badges}`;
  });

  // Dynamically fetch repo languages and add as an extra category
  try {
    const repos = await fetchUserRepos(user, token);
    const langCount = {};

    for (const repo of repos) {
      if (repo.language) {
        langCount[repo.language] = (langCount[repo.language] || 0) + 1;
      }
    }

    const sortedLangs = Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    if (sortedLangs.length > 0) {
      const badges = sortedLangs.map(([lang]) => {
        const name = encodeStr(lang, '_');
        const colors = getWallColor({ isHighlighted: true });
        const href = toTopicUrl(lang);
        return generateBadge({ name, logo: name, href, ...badgeGenericStyles, ...colors });
      }).join('\n');

      categorySections.push(`<strong>Languages from Code:</strong><br>${badges}`);
    }
  } catch (err) {
    console.error('Failed to fetch dynamic repo languages:', err.message);
    categorySections.push(`<!-- Dynamic language detection unavailable: ${err.message} -->`);
  }

  return generateElement('p', {
    children: categorySections.join('\n<br><br>\n'),
    align,
  });
};
