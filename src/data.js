// This data is passed to be used in the replacers. Like a ".env" file.
// I opted to not use .env so it is possible to create custom objects, arrays and logic here.
// You can modify, create or delete any property you want.
const theme = require('./theme');

module.exports = {
  user: 'Thomashighbaugh',
  startedProgramming: '06/03/2016',
  repoQuantity: 9,
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
        href: 'https://twitter.com/thomasleonhighbaugh',
      },
      {
        name: 'linkedin',
        href: 'https://linkedin.com/in/thomas-leon-highbaugh',
      },
      {
        name: 'email',
        logo: 'zoho',
        href: 'mailto:thighbaugh@zoho.com',
      },
      {
        name: 'alternative email',
        logo: 'thunderbird',
        href: 'mailto:me@thomasleonhighbaugh.me',
      },

      {
        name: 'codepen',
        href: 'https://codepen.io/thomashighbaughThomasLeonHighbaugh',
      },
      {
        name: 'thomasleonhighbaugh',
        logo: 'discord',
        labelColor: theme.colors.secondary,
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
          { name: 'BASH/ZSH', logo: 'gnu-bash', isHighlighted: true },
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
          { name: 'HTML' },
          { name: 'Ant-Design', isHighlighted: true },
          { name: 'Chakra', logo: 'chakraui' },
          { name: 'Bootstrap' },
          { name: 'Styled Components' },
          { name: 'TailwindCSS', isHighlighted: true },
          { name: 'Material-UI', isHighlighted: true },
          { name: 'Storybook' },
        ],
      },
      {
        name: 'Backend & Databases',
        skills: [
          { name: 'Node.JS', isHighlighted: true },
          { name: 'Express.js', logo: 'express' },
          { name: 'FastAPI', isHighlighted: true },
          { name: 'Flask' },
          { name: 'GraphQL' },
          { name: 'Firebase' },
          { name: 'MongoDB' },
          { name: 'SQLite' },
          { name: 'MERN Stack', isHighlighted: true },
        ],
      },
      {
        name: 'DevOps & Tools',
        skills: [
          { name: 'Docker', isHighlighted: true },
          { name: 'Git', isHighlighted: true },
          { name: 'GitHub' },
          { name: 'GitHub Actions', isHighlighted: true },
          { name: 'Gitlab' },
          { name: 'Codeberg' },
          { name: 'NPM' },
          { name: 'Linux', isHighlighted: true },
          { name: 'NixOS', isHighlighted: true },
          { name: 'Neovim', isHighlighted: true },
          { name: 'Visual Studio Code' },
          { name: 'JetBrains IDEs', logo: 'jetbrains' },
          { name: 'Netlify' },
          { name: 'Vercel' },
          { name: 'Heroku' },
          { name: 'Github Pages', logo: 'github' },
        ],
      },
      {
        name: 'Design',
        skills: [
          { name: 'Figma' },
          { name: 'Photoshop', logo: 'adobe-photoshop' },
          { name: 'GIMP' },
          { name: 'Inkscape' },
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
