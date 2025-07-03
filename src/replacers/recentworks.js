const fetch = require('node-fetch');

/**
 * Fetch recent public PushEvents for a given user.
 * @param {string} username
 * @param {string} [token] Optional GitHub token for private repos.
 * @returns {Promise<Array>} Array of unique, recently-pushed-to repos.
 */
async function getRecentPushRepos(username, token = null) {
  const headers = { 'User-Agent': 'recentworks-script' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const eventsUrl = `https://api.github.com/users/${username}/events/public`;

  const res = await fetch(eventsUrl, { headers });
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);

  const events = await res.json();
  // Filter for PushEvent types and deduplicate by repo full_name
  const seen = new Set();
  const repoMap = [];
  for (const event of events) {
    if (event.type === 'PushEvent') {
      const repo = event.repo;
      if (!seen.has(repo.name)) {
        repoMap.push({
          name: repo.name.split('/')[1],
          full_name: repo.name,
          html_url: `https://github.com/${repo.name}`,
          pushed_at: event.created_at,
        });
        seen.add(repo.name);
      }
    }
    if (repoMap.length >= 30) break; // reasonable limit
  }
  return repoMap;
}

/**
 * Format a repo as an HTML link (as in your original).
 * @param {Object} repo
 * @param {string} username
 * @returns {string}
 */
function formatRepo(repo, username) {
  return `<a href="${repo.html_url}">
    <img width="30%" max-height="5rem" align="center" alt="${repo.name}" src="https://github-readme-stats-server.vercel.app/api/pin/?username=${username}&repo=${encodeURIComponent(repo.name)}&title_color=FE3B7B&text_color=F2F2F2&bg_color=2c2c2c&border_color=525053&icon_color=F2F2F2&border_radius=15"/>
  </a>`;
}

/**
 * Main recentworks replacer function.
 * @param {Object} data { user: string, repoQuantity: number, [token]: string }
 * @returns {Promise<string>}
 */
module.exports = async function (data) {
  const { user, repoQuantity, token } = data;
  let repos;
  try {
    repos = await getRecentPushRepos(user, token);
  } catch (err) {
    return `<!-- Failed to load recent works: ${err.message} -->`;
  }
  return repos
    .slice(0, repoQuantity)
    .map(repo => formatRepo(repo, user))
    .join('\n');
};
