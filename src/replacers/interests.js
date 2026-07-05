// @ts-check

/**
 * Fetch user repos with topic data.
 * @param {string} username
 * @param {string|null} [token]
 * @returns {Promise<import('../types').GitHubRepo[]>}
 */
async function getUserRepos(username, token = null) {
  const headers = { 'User-Agent': 'interests-replacer', 'Accept': 'application/vnd.github.mercy-preview+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const url = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated&direction=desc`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch repos: ${res.status}`);
  
  return await res.json();
}

/**
 * Interests/topics replacer — aggregates repo topics into a clickable tag cloud.
 * @type {import('../types').ReplacerFunction}
 */
module.exports = async function (data) {
  const { user, token } = data;
  
  try {
    const repos = await getUserRepos(user, token);
    
    if (!repos || repos.length === 0) {
      return `<!-- No repos to extract topics from -->`;
    }
    
    // Collect all topics with frequency counting
    const topicCount = {};
    for (const repo of repos) {
      if (repo.topics && repo.topics.length > 0) {
        for (const topic of repo.topics) {
          topicCount[topic] = (topicCount[topic] || 0) + 1;
        }
      }
    }
    
    const topics = Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1]) // sort by frequency
      .slice(0, 20); // top 20
    
    if (topics.length === 0) {
      return `<!-- No topics found on repos -->`;
    }
    
    // Render as a tag cloud — clickable links to GitHub topic search
    const topicLinks = topics.map(([topic, count]) => {
      // Scale font size based on frequency (min 1, max 2.5)
      const maxCount = topics[0][1];
      const scale = 0.8 + (count / maxCount) * 1.2;
      const fontSize = `${Math.round(scale * 10) / 10}em`;
      return `<a href="https://github.com/topics/${encodeURIComponent(topic)}" style="font-size:${fontSize}; display:inline-block; margin:4px; text-decoration:none; color:#6AB0F3;">${topic}</a>`;
    }).join('');
    
    return `
<details open>
<summary><strong>🏷️ Technologies & Topics I Work With</strong></summary>
<br>

<p align="center">
${topicLinks}
</p>

<br>
<em><sub>Topics extracted from my public repositories.</sub></em>
</details>`;
    
  } catch (err) {
    console.error('Error in interests replacer:', err.message);
    return `<!-- Failed to load interests data: ${err.message} -->`;
  }
};