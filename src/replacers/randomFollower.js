const { getRandomFollower } = require('../utils/githubApi');
const { drawFollowerImage } = require('../utils/drawFollowerImage');

module.exports = async function (data) {
  const follower = await getRandomFollower(data.user);
  const imageName = 'randomFollower.png';

  await drawFollowerImage(follower, imageName);

  return `<a href="${follower.html_url}" alt="${follower.name}"><img style="height:150px; overflow:hidden; border-radius:8px;" src="https://raw.githubusercontent.com/Thomashighbaugh/Thomashighbaugh/main/src/resources/images/${imageName}" alt="Follower of the day"/></a>`;
};
