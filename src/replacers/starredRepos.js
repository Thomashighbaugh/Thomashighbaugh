/**
 * Fetch starred repos for a user, sorted by star count descending.
 */
async function getStarredRepos(username, token = null) {
  const headers = { 'User-Agent': 'starred-repos-script', 'Accept': 'application/vnd.github.star+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const url = `https://api.github.com/users/${username}/starred?per_page=30&sort=created&direction=desc`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch starred repos: ${res.status}`);
  
  return await res.json();
}

module.exports = async function (data) {
  const { user, token } = data;
  
  try {
    const starredData = await getStarredRepos(user, token);
    
    if (!starredData || starredData.length === 0) {
      return `<!-- No starred repos found -->`;
    }
    
    // The starred API returns { starred_at, repo } objects
    // Extract repos and sort by stargazers_count descending
    const repos = starredData
      .map(s => s.repo || s)
      .filter(r => r && !r.fork && r.stargazers_count > 0)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6);
    
    if (repos.length === 0) {
      return `<!-- No qualifying starred repos -->`;
    }
    
    const repoCards = repos.map(repo => {
      return `<a href="${repo.html_url}"><img width="30%" max-height="5rem" align="center" alt="${repo.name}" src="https://github-readme-stats-server.vercel.app/api/pin/?username=${repo.owner.login}&repo=${encodeURIComponent(repo.name)}&title_color=FE3B7B&text_color=F2F2F2&bg_color=2c2c2c&border_color=525053&icon_color=F2F2F2&border_radius=15"/></a>`;
    }).join('\n');
    
    return `
<details>
<summary><strong>🌟 Projects I'm Following</strong> (recently starred repos)</summary>
<br>

<em>Repos I've starred that I find interesting or useful:</em>

<br>
<br>

<p align="center">
${repoCards}
</p>

</details>`;
    
  } catch (err) {
    console.error('Error in starredRepos replacer:', err.message);
    return `<!-- Failed to load starred repos: ${err.message} -->`;
  }
};