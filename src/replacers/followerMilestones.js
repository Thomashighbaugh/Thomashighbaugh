// @ts-check

/** @type {number[]} */
const MILESTONES = [100, 250, 500, 1000, 2000, 5000, 10000];

/**
 * Fetch GitHub user profile info.
 * @param {string} username
 * @param {string|null} [token]
 * @returns {Promise<import('../types').GitHubFollower>}
 */
async function getUserInfo(username, token = null) {
  const headers = { 'User-Agent': 'follower-milestones' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/users/${username}`, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return await res.json();
}

/**
 * Follower milestones replacer — displays follower count, celebrations,
 * and progress toward the next milestone.
 * @type {import('../types').ReplacerFunction}
 */
module.exports = async function (data) {
  const { user, token } = data;
  
  try {
    const info = await getUserInfo(user, token);
    const followerCount = info.followers || 0;
    
    // Find crossed milestones
    const crossedMilestones = MILESTONES.filter(m => m <= followerCount);
    const nextMilestone = MILESTONES.find(m => m > followerCount);
    
    let celebrationHtml = '';
    if (crossedMilestones.length > 0) {
      // Find the highest crossed milestone
      const highest = crossedMilestones[crossedMilestones.length - 1];
      celebrationHtml = `\n  🎉 <strong>Celebrating ${highest}+ followers!</strong>`;
    }
    
    let progressHtml = '';
    if (nextMilestone) {
      const remaining = nextMilestone - followerCount;
      const progress = Math.round((followerCount / nextMilestone) * 100);
      progressHtml = `\n  <small>Next milestone: <strong>${nextMilestone}</strong> (${progress}% there — ${remaining} more to go)</small>`;
    }
    
    return `
<p align="center">
  <strong>👥 ${followerCount} Followers</strong>
  ${celebrationHtml}
  ${progressHtml}
</p>`;
    
  } catch (err) {
    console.error('Error in followerMilestones replacer:', err.message);
    return `<!-- Follower milestone data unavailable -->`;
  }
};