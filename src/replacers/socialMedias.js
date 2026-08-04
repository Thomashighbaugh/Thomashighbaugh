// @ts-check

const { generateBadge } = require('../utils/generateBadge');
const { generateElement } = require('../utils/generateElement');

/**
 * Social network names whose Simple Icons logo was removed (v14+).
 * `null` renders the badge as text-only instead of a broken icon.
 * @type {Record<string, string | null>}
 */
const LOGO_OVERRIDES = {
  twitter: 'x',
  linkedin: null,
  codepen: null,
};

/**
 * Social media links replacer.
 * @type {import('../types').ReplacerFunction}
 */
module.exports = function (data) {
  const socialMedias = data.socialMedias;
  const { align, ...badgeGenericStyles } = socialMedias.styles;

  const socialMediasHTML = socialMedias.links
    .map((socialMedia) => {
      const logo = LOGO_OVERRIDES[socialMedia.name] !== undefined
        ? LOGO_OVERRIDES[socialMedia.name]
        : socialMedia.logo ?? socialMedia.name;
      return generateBadge({
        ...socialMedia,
        ...badgeGenericStyles,
        logo,
      });
    })
    .join('\n');

  return generateElement('p', { children: socialMediasHTML, align });
};
