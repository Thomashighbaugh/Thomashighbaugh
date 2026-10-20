// @ts-check

const { generateBadge, generateViewsBadge } = require('../utils/generateBadge');
const { generateElement } = require('../utils/generateElement');

/**
 * Header replacer — banner image + contact badges.
 * @type {import('../types').ReplacerFunction}
 */
module.exports = function (data) {
  const header = data.header;
  const { align, ...badgeGenericStyles } = header.styles;

  const badgeTypes = {
    badge: (badgeProperties) => generateBadge(badgeProperties),
    // komarev only accepts username/label/color/style/base/abbreviated —
    // do NOT spread the shields.io generic styles (logoColor etc.) onto it
    views: () =>
      generateViewsBadge({
        username: data.user,
        label: 'Profile+Views',
        color: badgeGenericStyles.color,
        style: badgeGenericStyles.style,
      }),
  };

  const headerImage = generateElement('img', { ...header.image });

  const headerBadgesHTML = header.badges
    .map(({ type, ...badgeProperties }) =>
      badgeTypes[type]({
        ...badgeProperties,
        ...badgeGenericStyles,
        logo: badgeProperties.logo ?? badgeProperties.name,
      }),
    )
    .join('\n');

  const sections = [headerImage, headerBadgesHTML];

  return sections.map((section) => generateElement('p', { children: section, align })).join('\n');
};
