// @ts-check

// This data is passed to be used in the replacers. Like a ".env" file.
// I opted to not use .env so it is possible to create custom objects, arrays and logic here.
// You can modify, create or delete any property you want.
const theme = require('./theme');

/** @type {import('./types').ProjectData} */
module.exports = {
  user: 'Thomashighbaugh',
  token: process.env.GITHUB_TOKEN || null,
  header: {
    image: {
      src: 'https://raw.githubusercontent.com/Thomashighbaugh/Thomashighbaugh/main/src/resources/images/banner.svg',
      width: 850,
      height: 450,
    },
    styles: {
      align: 'center',
      style: 'for-the-badge',
      color: theme.colors.primary,
      logoColor: theme.colors.secondary,
    },
    badges: [
      {
        type: 'badge',
        name: 'contacts',
        href: 'https://links.thomasleonhighbaugh.me',
        logo: 'linktree',
      },

      {
        type: 'badge',
        name: 'website',
        href: 'https://thomasleonhighbaugh.me',
        logo: 'firefox',
      },
      {
        type: 'badge',
        name: 'resume',
        href: 'https://resume.thomasleonhighbaugh.me',
        logo: 'libreoffice',
      },
      {
        type: 'views',
      },
    ],
  },
  socialMedias: {
    styles: {
      align: 'left',
      style: 'plastic',
      color: theme.colors.primary,
      logoColor: theme.colors.white,
    },
    links: [
      {
        name: 'twitter',
        href: 'https://twitter.com/thomashighbaugh',
        logo: 'x',
      },
      {
        name: 'linkedin',
        href: 'https://linkedin.com/in/thomas-leon-highbaugh',
      },
      {
        name: 'email',
        logo: 'thunderbird',
        href: 'mailto:me@thomasleonhighbaugh.me',
      },
      {
        name: 'codepen',
        href: 'https://codepen.io/thomashighbaugh',
      },
      {
        name: 'discord',
        logo: 'discord',
        labelColor: theme.colors.secondary,
        href: 'https://discord.com/ThomasHighbaugh#3886',
      },
    ],
  },
  skillswall: {
    styles: {
      style: 'plastic',
      align: 'left',
    },
    randomOrder: false,
    categories: [
      {
        name: 'Languages',
        skills: [
          { name: 'JavaScript' },
          { name: 'TypeScript', isHighlighted: true },
          { name: 'Python' },
          { name: 'Lua' },
          { name: 'BASH/ZSH', logo: 'gnubash', isHighlighted: true },
          { name: 'Go', logo: 'go' },
          { name: 'Rust', logo: 'rust' },
          { name: 'Nix', logo: 'nixos' },
          { name: 'Zig', logo: 'zig' },
          { name: 'Scheme', logo: 'fa-code' },
          { name: 'Vimscript', logo: 'vim' },
        ],
      },
      {
        name: 'Frontend',
        skills: [
          { name: 'React', isHighlighted: true },
          { name: 'TSX', logo: 'react' },
          { name: 'jQuery' },
          { name: 'SASS' },
          { name: 'LESS' },
          { name: 'CSS' },
          { name: 'HTML', logo: 'html5' },
          { name: 'Ant-Design', isHighlighted: true },
          { name: 'Chakra', logo: 'chakraui' },
          { name: 'Bootstrap' },
          { name: 'Styled Components', logo: 'styledcomponents' },
          { name: 'TailwindCSS', isHighlighted: true },
          { name: 'Material-UI', isHighlighted: true },
          { name: 'Storybook' },
          { name: 'Next.js', logo: 'nextdotjs' },
          { name: 'Gatsby', logo: 'gatsby' },
          { name: 'Webpack', logo: 'webpack' },
        ],
      },
      {
        name: 'Backend & Databases',
        skills: [
          { name: 'Node.JS', logo: 'nodedotjs', isHighlighted: true },
          { name: 'Express.js', logo: 'express' },
          { name: 'FastAPI', isHighlighted: true },
          { name: 'Flask' },
          { name: 'GraphQL' },
          { name: 'Firebase' },
          { name: 'MongoDB' },
          { name: 'SQLite' },
          { name: 'MERN Stack', logo: 'fa-layer-group', isHighlighted: true },
          { name: 'TinaCMS', logo: 'tina' },
          { name: 'Pydantic', logo: 'pydantic' },
        ],
      },
      {
        name: 'AI & Agents',
        skills: [
          { name: 'OpenAI API', logo: 'openai', isHighlighted: true },
          { name: 'LangChain', logo: 'langchain', isHighlighted: true },
          { name: 'Ollama', logo: 'ollama', isHighlighted: true },
          { name: 'Google Gemini', logo: 'googlegemini' },
          { name: 'NVIDIA NIM', logo: 'nvidia' },
          { name: 'Prompt Engineering', logo: 'fa-wand-magic-sparkles', isHighlighted: true },
          { name: 'Agentic Workflows', logo: 'fa-robot' },
          { name: 'RAG', logo: 'fa-database' },
          { name: 'Embeddings', logo: 'fa-circle-nodes' },
          { name: 'Streamlit', logo: 'streamlit' },
        ],
      },
      {
        name: 'OS & Desktop',
        skills: [
          { name: 'Linux', logo: 'linux', isHighlighted: true },
          { name: 'Arch Linux', logo: 'archlinux', isHighlighted: true },
          { name: 'NixOS', logo: 'nixos', isHighlighted: true },
          { name: 'Manjaro', logo: 'manjaro' },
          { name: 'AwesomeWM', logo: 'awesomewm', isHighlighted: true },
          { name: 'i3', logo: 'i3' },
          { name: 'XFCE', logo: 'xfce' },
        ],
      },
      {
        name: 'Build & Deploy',
        skills: [
          { name: 'Docker', logo: 'docker', isHighlighted: true },
          { name: 'GitHub Actions', logo: 'githubactions', isHighlighted: true },
          { name: 'Ansible', logo: 'ansible' },
          { name: 'Make', logo: 'make' },
          { name: 'Netlify', logo: 'netlify' },
          { name: 'Vercel', logo: 'vercel' },
          { name: 'Heroku', logo: 'heroku' },
          { name: 'Github Pages', logo: 'github' },
        ],
      },
      {
        name: 'Dev Tools',
        skills: [
          { name: 'Git', logo: 'git', isHighlighted: true },
          { name: 'GitHub', logo: 'github' },
          { name: 'Gitlab', logo: 'gitlab' },
          { name: 'Codeberg', logo: 'codeberg' },
          { name: 'NPM', logo: 'npm' },
          { name: 'Neovim', logo: 'neovim', isHighlighted: true },
          { name: 'tmux', logo: 'tmux' },
          { name: 'Visual Studio Code' },
          { name: 'JetBrains IDEs', logo: 'jetbrains' },
          { name: 'Dotfiles', logo: 'fa-file-code' },
        ],
      },
      {
        name: 'Design',
        skills: [
          { name: 'Figma' },
          { name: 'Photoshop', logo: 'fa-image' },
          { name: 'GIMP' },
          { name: 'Inkscape' },
          { name: 'GTK Themes', logo: 'gtk' },
          { name: 'Icon Themes', logo: 'fa-icons' },
          { name: 'GRUB Themes', logo: 'fa-terminal' },
          { name: 'Base16', logo: 'fa-palette' },
          { name: 'SVG', logo: 'svg' },
          { name: 'Firefox userChrome', logo: 'firefox' },
        ],
      },
    ],
  },
  recentWorks: {
    enabled: true,
    maxEvents: 15,
    showRepoCards: true,
    maxRepoCards: 6,
  },
  starredRepos: {
    enabled: true,
    maxRepos: 6,
    minStars: 0,
  },
  followerMilestones: {
    enabled: true,
    milestones: [100, 250, 500, 1000, 2000, 5000, 10000],
  },
  interests: {
    enabled: true,
    maxTopics: 20,
  },
};
