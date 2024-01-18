const { getRepositories } = require('../utils/githubApi');

module.exports = async function (data) {
  const repos = await getRepositories(data.user);

  const getRecents = (a, b) => (new Date(a.updated_at) >= new Date(b.updated_at) ? -1 : 1);
  const formatJson = (elem) =>
    `<a href="${
      elem.html_url
    }"><img height="125px" min-height="125px" max-height="125px" width="40%" margin-top=0 margin-bottom=0 margin-right="5%" margin-left=0 src="https://github-readme-stats-server.vercel.app/api/pin/?username=${
      data.user
    }&repo=${encodeURIComponent(
      elem.name,
    )}&title_color=FE3B7B&text_color=F2F2F2&bg_color=2c2c2c&border_color=525053&icon_color=F2F2F2&border_radius=15"/></a>`;

  return repos.sort(getRecents).slice(0, data.repoQuantity).map(formatJson).join('\n');
};
