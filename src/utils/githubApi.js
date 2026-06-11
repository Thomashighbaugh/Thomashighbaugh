async function Request(url) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'user-agent': 'node.js',
  });
  return await (await fetch(url, headers)).json();
}

async function getRandomFollower(user) {
  const followers = await Request(`https://api.github.com/users/${user}/followers`);

  if (!followers || !Array.isArray(followers) || followers.length === 0) {
    return null;
  }

  // Fetch details for ALL followers to check quality
  const followerDetails = await Promise.all(
    followers.map(f => Request(f.url))
  );

  // Filter for quality followers
  const qualityFollowers = followerDetails.filter(f =>
    f &&
    f.avatar_url &&
    !f.type?.includes('Bot') &&
    !f.login?.endsWith('[bot]') &&
    f.public_repos > 0
    // Bio is nice-to-have but not required
  );

  // Use the filtered list, fall back to all followers if empty
  const pool = qualityFollowers.length > 0 ? qualityFollowers : followerDetails;

  // Use date-based seeding for "follower of the day" consistency
  const dateStr = new Date().toISOString().slice(0, 10); // "2026-06-10"
  const seed = hashCode(dateStr);
  const index = Math.abs(seed) % pool.length;

  return pool[index];
}

// Simple string hash function for seeding
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

async function getRepositories(user) {
  const repositories = Request(`https://api.github.com/users/${user}/repos`);
  return repositories;
}

module.exports = { getRandomFollower, getRepositories };
