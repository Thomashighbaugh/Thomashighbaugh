// @ts-check

const { getRandomFollower } = require('../utils/githubApi');
const { drawFollowerImage } = require('../utils/drawFollowerImage');
const { escapeHtml } = require('../utils/escapeHtml');

/**
 * Random follower showcase replacer.
 * Fetches a deterministic follower of the day, composites their avatar,
 * and displays enriched info (name, bio, stats).
 * @type {import('../types').ReplacerFunction}
 */
module.exports = async function (data) {
  try {
    const follower = await getRandomFollower(data.user, data.token);

    if (!follower) {
      return `<!-- No followers to showcase yet -->\n<em>No followers found yet. Once you gain followers, they'll be showcased here!</em>`;
    }

    // Try to generate the composited image; fall back to plain avatar on failure
    const imageName = 'randomFollower.png';
    const imageGenerated = await drawFollowerImage(follower, imageName);

    // GitHub strips inline styles — use the height attribute instead.
    // The alt text is third-party data and is escaped.
    let imgTag;
    if (imageGenerated) {
      imgTag = `<img height="150" src="https://raw.githubusercontent.com/Thomashighbaugh/Thomashighbaugh/main/src/resources/images/${imageName}" alt="Follower of the day: ${escapeHtml(follower.login)}"/>`;
    } else {
      // Fallback: use GitHub avatar directly
      imgTag = `<img height="150" src="${escapeHtml(follower.avatar_url)}" alt="Follower of the day: ${escapeHtml(follower.login)}"/>`;
    }

    // Enriched display with name, bio, stats (third-party data — escaped)
    const name = follower.name || follower.login;
    const bio = follower.bio ? follower.bio.slice(0, 120) : '';
    const stats = `${follower.public_repos} public repos · ${follower.followers} followers`;

    return `
<p align="center">
  <a href="${escapeHtml(follower.html_url)}">${imgTag}</a>
  <br>
  <strong><a href="${escapeHtml(follower.html_url)}">${escapeHtml(name)}</a></strong>
  ${bio ? `<br><em>${escapeHtml(bio)}</em>` : ''}
  <br>
  <small>${escapeHtml(stats)}</small>
</p>`;
  } catch (error) {
    console.error('Error in randomFollower replacer:', error.message);
    return `<!-- Failed to load follower showcase: ${error.message} -->`;
  }
};
