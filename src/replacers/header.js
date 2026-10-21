// @ts-check

const { generateBadge } = require('../utils/generateBadge');
const { generateElement } = require('../utils/generateElement');

/**
 * Read the current profile-view count from komarev's SVG badge.
 *
 * The README is regenerated daily, so fetching the number at build time and
 * emitting a plain shields.io badge gives a live-enough counter with none of
 * the fragility of pointing the rendered README at the ghpvc host (which was
 * intermittently failing to load and breaking the 4th header button).
 *
 * @param {string} user
 * @returns {Promise<number|null>} the count, or null if it can't be read
 */
async function fetchViewCount(user) {
  try {
    const res = await fetch(
      `https://komarev.com/ghpvc/?username=${user}&style=for-the-badge&color=3c3c3c`,
      { headers: { 'User-Agent': 'profile-views-fetch' } },
    );
    if (!res.ok) return null;
    const svg = await res.text();
    // aria-label="PROFILE VIEWS: 5,998" / <title>PROFILE VIEWS: 5,998</title>
    const match = svg.match(/PROFILE VIEWS:\s*([\d,]+)/i);
    if (!match) return null;
    return Number(match[1].replace(/,/g, ''));
  } catch {
    return null;
  }
}

/**
 * Header replacer — banner image + contact badges.
 * @type {import('../types').ReplacerFunction}
 */
module.exports = async function (data) {
  const header = data.header;
  const { align, ...badgeGenericStyles } = header.styles;

  const badgeTypes = {
    badge: (badgeProperties) => generateBadge(badgeProperties),
    views: async () => {
      const count = await fetchViewCount(data.user);
      // Encode for the shields.io badge path — a raw space/comma breaks the URL.
      // If the count can't be read, fall back to a static badge rather than a
      // broken third-party image.
      return generateBadge({
        name: 'Profile%20Views',
        message: encodeURIComponent(count === null ? 'n/a' : count.toLocaleString('en-US')),
        color: badgeGenericStyles.color,
        style: badgeGenericStyles.style,
        logoColor: badgeGenericStyles.logoColor,
      });
    },
  };

  const headerImage = generateElement('img', { ...header.image });

  const headerBadgesHTML = (
    await Promise.all(
      header.badges.map(({ type, ...badgeProperties }) =>
        badgeTypes[type]({
          ...badgeProperties,
          ...badgeGenericStyles,
          logo: badgeProperties.logo ?? badgeProperties.name,
        }),
      ),
    )
  ).join('\n');

  const sections = [headerImage, headerBadgesHTML];

  return sections.map((section) => generateElement('p', { children: section, align })).join('\n');
};
