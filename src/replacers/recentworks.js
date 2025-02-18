const { getRepositories } = require('../utils/githubApi');

/**
 * This function retrieves the most recent repositories of a user and formats them into HTML links.
 *
 * @param {Object} data - The data object containing the user's username and the number of repositories to retrieve.
 * @param {string} data.user - The username of the user.
 * @param {number} data.repoQuantity - The number of repositories to retrieve.
 * @returns {Promise<string>} - A string containing the HTML links to the most recent repositories.
 */
module.exports = async function (data) {
  // Retrieve the repositories of the user
  const repos = await getRepositories(data.user);

  /**
   * This function compares two repositories based on their update date.
   *
   * @param {Object} a - The first repository to compare.
   * @param {Object} b - The second repository to compare.
   * @returns {number} - A negative number if a should be sorted before b, a positive number if a should be sorted after b, and 0 if they are equal.
   */
  const getRecents = (a, b) => (new Date(a.updated_at) > new Date(b.updated_at) ? -1 : 1);

  /**
   * This function formats a repository into an HTML link.
   *
   * @param {Object} elem - The repository to format.
   * @returns {string} - The HTML link to the repository.
   */
  const formatJson = (elem) =>
    `<a href="${
      elem.html_url
    }"><img width="33%"  max-height="5rem" align="center" alt="${elem.name}"   src="https://github-readme-stats-server.vercel.app/api/pin/?username=${
      data.user
    }&repo=${encodeURIComponent(
      elem.name,
    )}&title_color=FE3B7B&text_color=F2F2F2&bg_color=2c2c2c&border_color=525053&icon_color=F2F2F2&border_radius=15"/></a>`;

  // Sort the repositories by update date and format them into HTML links
  return repos.sort(getRecents).slice(0, data.repoQuantity).map(formatJson).join('\n');
};
