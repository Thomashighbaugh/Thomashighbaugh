// @ts-check

/**
 * @param {string} url
 * @param {string|null} [token]
 * @returns {Promise<any>}
 */
async function request(url, token = null) {
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
  const followers = await request(
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
  // A profile whose bio reads like placeholder chrome ("Loading...") looks
  // broken on a rendered card, so those are skipped in favour of the next
  // follower. Only a handful of detail calls are made before giving up.
  const PLACEHOLDER_BIO = /^(loading|please wait|coming soon)[.\u2026!\s]*$/i;
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < Math.min(MAX_ATTEMPTS, candidates.length); attempt++) {
    const pick = candidates[(index + attempt) % candidates.length];
    const detail = await request(pick.url, token).catch(() => null);

    const usable =
      detail &&
      detail.avatar_url &&
      !detail.type?.includes('Bot') &&
      detail.public_repos > 0 &&
      !PLACEHOLDER_BIO.test(String(detail.bio || '').trim());

    if (usable) return detail;
  }

  // Nothing passed: fall back to the seeded candidate so the card still renders.
  return candidates[index];
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
  return request(`https://api.github.com/users/${user}/repos?per_page=100`, token);
}

module.exports = { getRandomFollower, getRepositories };
