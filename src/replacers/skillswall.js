const theme = require('../theme');
const { generateBadge } = require('../utils/generateBadge');
const { generateElement } = require('../utils/generateElement');

const wallColors = [theme.colors.primary, theme.colors.lightPrimary];
const highlightColor = theme.colors.primary;

const getWallColor = (options = { isHighlighted: false }) => ({
  color: options.isHighlighted ? highlightColor : wallColors[Math.floor(Math.random() * wallColors.length)],
  logoColor: theme.colors.white,
});

const encodeStr = (str, replacer) => {
  return encodeURI(str.toLowerCase().replace(/-/g, replacer));
};

module.exports = function (data) {
  const skillswall = data.skillswall;
  const { align, ...badgeGenericStyles } = skillswall.styles;

  // Render each category
  const categorySections = skillswall.categories.map(category => {
    const badges = category.skills.map(skill => {
      const name = encodeStr(skill.name, '_');
      const logo = encodeStr(skill.logo ?? skill.name, '+');
      const colors = getWallColor({ isHighlighted: skill.isHighlighted });
      return generateBadge({ name, logo, ...badgeGenericStyles, ...colors });
    }).join('\n');

    return `<strong>${category.name}:</strong><br>${badges}`;
  });

  return generateElement('p', {
    children: categorySections.join('\n<br><br>\n'),
    align,
  });
};
