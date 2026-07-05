// @ts-check

/**
 * Fetch recent public events for a user and map to readable activity items.
 * @param {string} username
 * @param {string|null} [token]
 * @returns {Promise<import('../types').ActivityItem[]>}
 */
async function getRecentEvents(username, token = null) {
  const headers = { 'User-Agent': 'recentworks-script' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const eventsUrl = `https://api.github.com/users/${username}/events/public`;
  const res = await fetch(eventsUrl, { headers });
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);

  const events = await res.json();

  // Map event types to readable descriptions
  const eventDisplay = {
    PushEvent: (e) => {
      const commitCount = e.payload?.size || e.payload?.commits?.length || e.payload?.distinct_size || 0;
      const branch = e.payload?.ref?.replace('refs/heads/', '') || 'main';
      return {
        icon: '📝',
        action: `Pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''} to`,
        repo: e.repo.name,
        url: `https://github.com/${e.repo.name}`,
        detail: `on ${branch}`,
        date: e.created_at,
      };
    },
    CreateEvent: (e) => ({
      icon: '📦',
      action: `Created ${e.payload.ref_type}`,
      repo: e.repo.name,
      url: `https://github.com/${e.repo.name}`,
      detail: e.payload.ref ? e.payload.ref : '',
      date: e.created_at,
    }),
    ForkEvent: (e) => ({
      icon: '🔀',
      action: `Forked`,
      repo: e.repo.name,
      url: `https://github.com/${e.repo.name}`,
      detail: '',
      date: e.created_at,
    }),
    IssuesEvent: (e) => ({
      icon: '🐛',
      action: `${e.payload.action === 'opened' ? 'Opened' : 'Closed'} issue`,
      repo: e.repo.name,
      url: `https://github.com/${e.repo.name}`,
      detail: e.payload.issue?.title ? `"${e.payload.issue.title.slice(0, 60)}"` : '',
      date: e.created_at,
    }),
    ReleaseEvent: (e) => ({
      icon: '🏷️',
      action: `Released ${e.payload.release?.tag_name || 'new version'}`,
      repo: e.repo.name,
      url: `https://github.com/${e.repo.name}`,
      detail: '',
      date: e.created_at,
    }),
    WatchEvent: (e) => ({
      icon: '⭐',
      action: `Starred`,
      repo: e.repo.name,
      url: `https://github.com/${e.repo.name}`,
      detail: '',
      date: e.created_at,
    }),
    PublicEvent: (e) => ({
      icon: '🌍',
      action: `Made public`,
      repo: e.repo.name,
      url: `https://github.com/${e.repo.name}`,
      detail: '',
      date: e.created_at,
    }),
  };

  const activities = [];
  const seenRepos = new Set();

  for (const event of events) {
    const display = eventDisplay[event.type];
    if (!display) continue;

    const item = display(event);

    // Deduplicate: only show each repo once per event type
    const dedupKey = `${event.type}-${event.repo.name}`;
    if (seenRepos.has(dedupKey)) continue;
    seenRepos.add(dedupKey);

    activities.push(item);
    if (activities.length >= 15) break; // limit
  }

  return activities;
}

/**
 * Format a date string as relative time (e.g. "2 days ago").
 * @param {string} dateStr - ISO date string
 * @returns {string}
 */
function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

/**
 * Recent events replacer — fetches public GitHub events and renders
 * a timeline with repo pin cards.
 * @type {import('../types').ReplacerFunction}
 */
module.exports = async function (data) {
  const { user, token } = data;

  try {
    const events = await getRecentEvents(user, token);

    if (!events || events.length === 0) {
      return `<!-- No recent public activity -->\n<em>No recent public activity to show. Check back after the next commit!</em>`;
    }

    // Build the activity timeline
    const activityList = events.map(e =>
      `  <li>${e.icon} ${e.action} <a href="${e.url}">${e.repo}</a> ${e.detail ? `${e.detail} ` : ''}<small><em>— ${timeAgo(e.date)}</em></small></li>`
    ).join('\n');

    // Also generate repo pin cards for PushEvents (duck-typing: push-style events)
    // Find unique pushed repos
    const pushedRepos = [...new Set(
      events
        .filter(e => e.icon === '📝')
        .map(e => e.repo)
    )];

    const repoCards = pushedRepos.slice(0, 6).map(repoName => {
      const repo = repoName.split('/')[1];
      return `<a href="https://github.com/${repoName}"><img width="45%" style="max-height:5rem" align="center" alt="${repo}" src="https://github-readme-stats-server.vercel.app/api/pin/?username=${user}&repo=${encodeURIComponent(repo)}&title_color=FE3B7B&text_color=F2F2F2&bg_color=2c2c2c&border_color=525053&icon_color=F2F2F2&border_radius=15"/></a>`;
    }).join('\n');

    return `
<br>

<ul>
${activityList}
</ul>

${repoCards ? `<br>\n<p align="center">${repoCards}</p>` : ''}`;

  } catch (err) {
    return `<!-- Failed to load recent works: ${err.message} -->`;
  }
};