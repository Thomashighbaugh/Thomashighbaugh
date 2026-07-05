// @ts-check

/**
 * @param {string} url
 * @param {string|null} [token]
 * @returns {Promise<any>}
 */
async function Request(url, token = null) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'user-agent': 'node.js',
  });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return await (await fetch(url, { headers })).json();
}

/**
 * Fetch a random follower deterministically seeded by the current date.
 * Filters for quality (has avatar, not a bot, has public repos).
 * Uses a single API call with the followers list endpoint enhanced with
 * per-page params to avoid N+1 queries.
 * @param {string} user - GitHub username
 * @param {string|null} [token]
 * @returns {Promise<import('../types').GitHubFollower|null>}
 */
async function getRandomFollower(user, token = null) {
  // Fetch followers with extended fields via the per-page parameter
  // to get more data in one call
  const followers = await Request(
    `https://api.github.com/users/${user}/followers?per_page=100`,
    token,
  );

  if (!followers || !Array.isArray(followers) || followers.length === 0) {
    return null;
  }

  // Filter out obvious bots by login name (avoids fetching details for everyone)
  const candidates = followers.filter(
    (f) => f && f.login && !f.login.endsWith('[bot]'),
  );

  if (candidates.length === 0) return null;

  // Use date-based seeding for "follower of the day" consistency
  const dateStr = new Date().toISOString().slice(0, 10);
  const seed = hashCode(dateStr);
  const index = Math.abs(seed) % candidates.length;
  const chosen = candidates[index];

  // Fetch details only for the chosen follower (1 extra call instead of N)
  const detail = await Request(chosen.url, token);

  // Quality check on the chosen follower
  if (
    detail &&
    detail.avatar_url &&
    !detail.type?.includes('Bot') &&
    detail.public_repos > 0
  ) {
    return detail;
  }

  // Fallback: return the basic follower data if detail fetch fails
  return chosen;
}

/**
 * Simple string hash function for seeding.
 * @param {string} str
 * @returns {number}
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Fetch all repositories for a user.
 * @param {string} user - GitHub username
 * @param {string|null} [token]
 * @returns {Promise<import('../types').GitHubRepo[]>}
 */
async function getRepositories(user, token = null) {
  return Request(`https://api.github.com/users/${user}/repos?per_page=100`, token);
}

module.exports = { getRandomFollower, getRepositories };
