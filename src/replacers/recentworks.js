// @ts-check

const { escapeHtml } = require('../utils/escapeHtml');

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

  /**
   * Count commits for a push event.
   * The public events API no longer includes `size`/`commits` in
   * PushEvent payloads, so fall back to the compare API using the
   * `before` and `head` SHAs the event does carry.
   * Returns null when the count cannot be determined.
   */
  async function getPushCommitCount(e) {
    const { size, commits, distinct_size } = e.payload;
    const count = size ?? commits?.length ?? distinct_size;
    if (count !== undefined && count !== null) return count;

    const { before, head, repository_id } = e.payload;
    if (!before || !head || before === head) return null;

    try {
      const owner = e.repo.name.split('/')[0];
      const repo = e.repo.name.split('/')[1];
      const compare = await fetch(
        `https://api.github.com/repositories/${repository_id}/compare/${before}...${head}`,
        { headers },
      );
      if (!compare.ok) return null;
      const data = await compare.json();
      return data?.total_commits ?? null;
    } catch {
      return null;
    }
  }

  // Map event types to readable descriptions
  const eventDisplay = {
    PushEvent: async (e) => {
      const commitCount = await getPushCommitCount(e);
      const branch = e.payload?.ref?.replace('refs/heads/', '') || 'main';
      return {
        icon: '📝',
        action:
          commitCount === null
            ? `Pushed to`
            : `Pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''} to`,
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

  const seenRepos = new Set();

  // Deduplicate first (cheap, synchronous) so we only await the events we keep.
  const kept = [];
  for (const event of events) {
    const display = eventDisplay[event.type];
    if (!display) continue;

    const dedupKey = `${event.type}-${event.repo.name}`;
    if (seenRepos.has(dedupKey)) continue;
    seenRepos.add(dedupKey);

    kept.push({ event, display });
    if (kept.length >= 15) break; // limit
  }

  // Resolve the kept events in parallel; Promise.all preserves input order.
  // PushEvents may each trigger a compare API call — serial awaits made
  // this up to ~15 sequential round-trips.
  return await Promise.all(kept.map(({ event, display }) => display(event)));
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
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365)
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
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

    // Build the activity timeline.
    // All values originate from the GitHub API and are escaped before
    // interpolation — issue titles, branch and tag names are attacker-controlled.
    const activityList = events
      .map(
        (e) =>
          `  <li>${e.icon} ${escapeHtml(e.action)} <a href="${escapeHtml(e.url)}">${escapeHtml(e.repo)}</a> ${e.detail ? `${escapeHtml(e.detail)} ` : ''}<small><em>— ${timeAgo(e.date)}</em></small></li>`,
      )
      .join('\n');

    return `
<br>

<ul>
${activityList}
</ul>`;
  } catch (err) {
    return `<!-- Failed to load recent works: ${err.message} -->`;
  }
};
