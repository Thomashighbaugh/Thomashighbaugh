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
      src: 'src/resources/images/banner.svg',
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
    randomOrder: true,
    skills: [
      { name: 'Linux', isHighlighted: true },
      { name: 'NixOS', isHighlighted: true },
      { name: 'JavaScript' },
      { name: 'Typescript', isHighlighted: true },
      { name: 'HTML5' },
      { name: 'HTML' },
      { name: 'XHTML' },
      { name: 'XML' },
      { name: 'JSON' },
      { name: 'SVG' },
      { name: 'Markdown' },
      { name: 'CSS3' },
      { name: 'CSS' },
      { name: 'Python' },
      { name: 'BASH/ZSH', logo: 'gnu-bash', isHighlighted: true },
      { name: 'React', isHighlighted: true },
      { name: 'TSX', logo: 'react' },
      { name: 'jQuery' },
      { name: 'SASS' },
      { name: 'LESS' },
      { name: 'Ant-Design', isHighlighted: true },
      { name: 'GraphQL' },
      { name: 'Chakra', logo: 'chakraui' },
      { name: 'Bootstrap' },
      { name: 'Node.JS', isHighlighted: true },
      { name: 'Jest' },
      { name: 'Express.js', logo: 'express' },
      { name: 'FastAPI', isHighlighted: true },
      { name: 'Flask' },
      { name: 'Styled Components' },
      { name: 'TailwindCSS', isHighlighted: true },
      { name: 'Firebase' },
      { name: 'Lua' },
      { name: 'MongoDB' },
      { name: 'MERN Stack', isHighlighted: true },
      { name: 'SQLite' },
      { name: 'TypeScript', isHighlighted: true },
      { name: 'Netlify' },
      { name: 'Vercel' },
      { name: 'Heroku' },
      { name: 'Github Pages', logo: 'github' },
      { name: 'Photoshop', logo: 'adobe-photoshop' },
      { name: 'GIMP' },
      { name: 'Inkscape' },
      { name: 'Figma' },
      { name: 'Storybook' },
      { name: 'NPM' },
      { name: 'Git', isHighlighted: true },
      { name: 'GitHub' },
      { name: 'Gitlab' },
      { name: 'Codeberg' },
      { name: 'Visual Studio Code' },
      { name: 'JetBrains IDEs', logo: 'jetbrains' },
      { name: 'Neovim', isHighlighted: true },
      { name: 'Docker', isHighlighted: true },
      { name: 'GitHub Actions', isHighlighted: true },
    ],
  },
};
