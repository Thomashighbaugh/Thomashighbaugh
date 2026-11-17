// @ts-check

/**
 * Shared skill metadata: Simple Icons slug + brand color per skill, plus the
 * GitHub topic URL each skill links to.
 *
 * The legacy `skillswall` replacer used shields.io logo params; vice renders
 * the icon directly from the Simple Icons CDN, so both read this map.
 */

/**
 * Map of skill name to Simple Icons slug and brand color.
 * `null` slug renders the pill as text only — Simple Icons v14 removed
 * several brands (LinkedIn, CodePen, VS Code, Heroku, Photoshop, CSS3).
 *
 * @type {Record<string, {slug: string, color: string} | null>}
 */
const SKILL_ICONS = {
  JavaScript: { slug: 'javascript', color: 'f7df1e' },
  TypeScript: { slug: 'typescript', color: '3178c6' },
  Python: { slug: 'python', color: '3776ab' },
  Lua: { slug: 'lua', color: '2c2d72' },
  'BASH/ZSH': { slug: 'gnubash', color: '4eaa25' },
  React: { slug: 'react', color: '61dafb' },
  jQuery: { slug: 'jquery', color: '0769ad' },
  SASS: { slug: 'sass', color: 'cc6699' },
  LESS: { slug: 'less', color: 'd25a8a' },
  HTML: { slug: 'html5', color: 'e34f26' },
  'Ant-Design': { slug: 'antdesign', color: '0170fe' },
  Chakra: { slug: 'chakraui', color: '1fc7ec' },
  Bootstrap: { slug: 'bootstrap', color: '7952b3' },
  'Styled Components': { slug: 'styledcomponents', color: 'db7093' },
  TailwindCSS: { slug: 'tailwindcss', color: '06b6d4' },
  'Material-UI': { slug: 'mui', color: '007fff' },
  Storybook: { slug: 'storybook', color: 'ff4785' },
  'Node.JS': { slug: 'node.js', color: '68a063' },
  'Express.js': { slug: 'express', color: '000000' },
  FastAPI: { slug: 'fastapi', color: '009688' },
  Flask: { slug: 'flask', color: '000000' },
  GraphQL: { slug: 'graphql', color: 'e10098' },
  Firebase: { slug: 'firebase', color: 'ffca28' },
  MongoDB: { slug: 'mongodb', color: '4ea94b' },
  SQLite: { slug: 'sqlite', color: '003b57' },
  Docker: { slug: 'docker', color: '2496ed' },
  Git: { slug: 'git', color: 'f05032' },
  GitHub: { slug: 'github', color: 'ffffff' },
  'GitHub Actions': { slug: 'githubactions', color: '2088ff' },
  Gitlab: { slug: 'gitlab', color: 'e24329' },
  Codeberg: { slug: 'codeberg', color: '2a2a2a' },
  NPM: { slug: 'npm', color: 'cb3837' },
  Linux: { slug: 'linux', color: 'fcc624' },
  NixOS: { slug: 'nixos', color: '5277c3' },
  Neovim: { slug: 'neovim', color: '57b1e3' },
  'JetBrains IDEs': { slug: 'jetbrains', color: 'f54c3c' },
  Netlify: { slug: 'netlify', color: '00c7b7' },
  Vercel: { slug: 'vercel', color: 'ffffff' },
  'Github Pages': { slug: 'github', color: 'ffffff' },
  Figma: { slug: 'figma', color: 'f24e1e' },
  GIMP: { slug: 'gimp', color: '486584' },
  Inkscape: { slug: 'inkscape', color: 'ffffff' },
};

/**
 * Map of skill names to specific GitHub topic slugs for edge cases.
 * Falls back to auto-slugify if no entry here.
 * @type {Record<string, string>}
 */
const TOPIC_MAP = {
  'BASH/ZSH': 'bash',
  'Node.JS': 'nodejs',
  TSX: 'typescript',
  'MERN Stack': 'mern',
  'Visual Studio Code': 'vscode',
  'JetBrains IDEs': 'jetbrains',
  'Styled Components': 'styled-components',
  'Material-UI': 'material-ui',
  'TailwindCSS': 'tailwind-css',
  'Ant-Design': 'ant-design',
  Chakra: 'chakra-ui',
  'GitHub Actions': 'github-actions',
  NPM: 'npm',
  'Github Pages': 'github-pages',
  'GitHub': 'github',
  'Node.JS ': 'nodejs',
  'Express.js': 'express-js',
  'GitHub Pages': 'github-pages',
  'JetBrains IDEs ': 'jetbrains',
  'Visual Studio Code ': 'vscode',
  Heroku: 'heroku',
  Figma: 'figma',
  // Slugs whose auto-slugified form does not match a real GitHub topic.
  'Next.js': 'nextjs',
  Nix: 'nix',
  Vimscript: 'vim',
  TinaCMS: 'tinacms',
  'OpenAI API': 'openai-api',
  'Prompt Engineering': 'prompt-engineering',
  'Agentic Workflows': 'agentic-workflow',
  'Arch Linux': 'arch-linux',
  AwesomeWM: 'awesomewm',
  'GTK Themes': 'gtk-theme',
  'Icon Themes': 'icon-theme',
  'GRUB Themes': 'grub-theme',
  Base16: 'base16',
  'Firefox userChrome': 'userchrome',
  Dotfiles: 'dotfiles',
  LangChain: 'langchain',
  Ollama: 'ollama',
  'Google Gemini': 'google-gemini',
  'NVIDIA NIM': 'nvidia-nim',
  RAG: 'retrieval-augmented-generation',
  Embeddings: 'embeddings',
};

/**
 * Normalize a skill name to a GitHub topic slug.
 * @param {string} name
 * @returns {string}
 */
function toTopicSlug(name) {
  const mapped = TOPIC_MAP[name];
  if (mapped) return mapped;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build the GitHub topic URL for a skill.
 * @param {string} name
 * @returns {string}
 */
function toTopicUrl(name) {
  return `https://github.com/topics/${encodeURIComponent(toTopicSlug(name))}`;
}

/**
 * Build a Simple Icons CDN URL for a skill.
 * @param {string} name - skill display name
 * @param {string} [logoOverride] - explicit slug from the skill definition
 * @returns {string|null} the CDN URL, or null when the brand has no icon
 */
function toSimpleIconsUrl(name, logoOverride) {
  const entry = SKILL_ICONS[name];
  const slug = logoOverride || (entry ? entry.slug : null);
  if (!slug) return null;
  const color = entry ? entry.color : 'ffffff';
  return `https://cdn.simpleicons.org/${slug}/${color}`;
}

module.exports = { SKILL_ICONS, toTopicSlug, toTopicUrl, toSimpleIconsUrl };
