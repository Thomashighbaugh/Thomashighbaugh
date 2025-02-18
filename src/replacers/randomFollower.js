const { getRandomFollower } = require('../utils/githubApi');
const { drawFollowerImage } = require('../utils/drawFollowerImage');

module.exports = async function (data) {
  const follower = await getRandomFollower(data.user);
  const imageName = 'randomFollower.png';

  drawFollowerImage(follower, imageName);

  return `<a href="${follower.html_url}" alt="${follower.name}"><img style="block-size:150px; overflow:none !important;" src=./src/resources/images/${imageName} alt="Follower of the day"/></a>`;
};
