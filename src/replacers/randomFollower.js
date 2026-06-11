const { getRandomFollower } = require('../utils/githubApi');
const { drawFollowerImage } = require('../utils/drawFollowerImage');

module.exports = async function (data) {
  try {
    const follower = await getRandomFollower(data.user);

    if (!follower) {
      return `<!-- No followers to showcase yet -->\n<em>No followers found yet. Once you gain followers, they'll be showcased here!</em>`;
    }

    // Try to generate the composited image; fall back to plain avatar on failure
    const imageName = 'randomFollower.png';
    const imageGenerated = await drawFollowerImage(follower, imageName);

    let imgTag;
    if (imageGenerated) {
      imgTag = `<img style="height:150px; overflow:hidden; border-radius:8px;" src="https://raw.githubusercontent.com/Thomashighbaugh/Thomashighbaugh/main/src/resources/images/${imageName}" alt="Follower of the day: ${follower.login}"/>`;
    } else {
      // Fallback: use GitHub avatar directly
      imgTag = `<img style="height:150px; border-radius:8px;" src="${follower.avatar_url}" alt="Follower of the day: ${follower.login}"/>`;
    }

    // Enriched display with name, bio, stats
    const name = follower.name || follower.login;
    const bio = follower.bio ? follower.bio.slice(0, 120) : '';
    const stats = `${follower.public_repos} public repos · ${follower.followers} followers`;

    return `
<p align="center">
  <a href="${follower.html_url}">${imgTag}</a>
  <br>
  <strong><a href="${follower.html_url}">${name}</a></strong>
  ${bio ? `<br><em>${bio}</em>` : ''}
  <br>
  <small>${stats}</small>
</p>`;

  } catch (error) {
    console.error('Error in randomFollower replacer:', error.message);
    return `<!-- Failed to load follower showcase: ${error.message} -->`;
  }
};
