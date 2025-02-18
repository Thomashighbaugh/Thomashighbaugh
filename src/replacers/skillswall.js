const theme = require('../theme');
const { generateBadge } = require('../utils/generateBadge');
const { generateElement } = require('../utils/generateElement');

/**
 * Array of colors used for the skills wall
 * @type {Array}
 */
const wallColors = [theme.colors.primary, theme.colors.lightPrimary];

/**
 * Highlight color used for the skills wall
 * @type {string}
 */
const highlightColor = theme.colors.primary;

/**
 * Function to get a random item from an array
 * @param {Array} array - Array to get a random item from
 * @returns {*} - Random item from the array
 */
const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

/**
 * Function to get the color and logo color for a skill in the skills wall
 * @param {Object} options - Options for the function
 * @param {boolean} options.isHighlighted - If the skill is highlighted
 * @returns {Object} - Object with the color and logo color for the skill
 */
const getWallColor = (options = { isHighlighted: false }) => ({
  color: options.isHighlighted ? highlightColor : randomItem(wallColors),
  logoColor: theme.colors.white,
});

/**
 * Function to encode a string
 * @param {string} str - String to encode
 * @param {string} replacer - Character to replace '-' with
 * @returns {string} - Encoded string
 */
const encodeStr = (str, replacer) => {
  return encodeURI(str.toLowerCase().replace(/-/g, replacer));
};

/**
 * Function to replace the skillswall tag with an HTML element
 * @param {Object} data - Data object containing the skillswall tag
 * @returns {string} - HTML element with the skillswall tag replaced
 */
module.exports = function (data) {
  const skillswall = data.skillswall;
  const { align, ...badgeGenericStyles } = skillswall.styles;

  // Map each skill to a badge and sort the badges randomly if specified
  const imgSkills = skillswall.skills.map((skill) => {
    const name = encodeStr(skill.name, '_');
    const logo = encodeStr(skill.logo ?? skill.name, '+');
    const colors = getWallColor({ isHighlighted: skill.isHighlighted });

    return generateBadge({ name, logo, ...badgeGenericStyles, ...colors });
  });

  if (skillswall.randomOrder) imgSkills.sort(() => Math.random() - 0.5);

  // Generate a HTML paragraph element with the badges as children
  return generateElement('p', { children: imgSkills.join('\n'), align });
};
