// @ts-check

/**
 * Escape a value for safe insertion into generated HTML.
 *
 * GitHub sanitizes README HTML, so this is not an XSS gate — but unescaped
 * third-party API data (follower bios/names, issue titles, branch and tag
 * names) can still inject markup, links and images into the rendered README.
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { escapeHtml };
