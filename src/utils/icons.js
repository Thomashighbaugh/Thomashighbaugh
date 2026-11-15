// @ts-check

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.resolve('.opencode/cache/icons');

/**
 * Fetch a Simple Icons SVG, extract its <path> data, and cache it.
 * Returns { pathData, viewBox } suitable for rendering as an inline
 * <svg><path d="..." /></svg> element — no , no external URL,
 * nothing GitHub's sanitizer will strip from embedded README SVGs.
 *
 * @param {string} slug - Simple Icons slug (e.g. 'discord', 'x', 'javascript')
 * @param {string} color - Hex color without # (e.g. '5865f2')
 * @returns {Promise<{pathData: string, viewBox: string} | null>}
 */
async function fetchIcon(slug, color) {
  const cacheKey = `${slug}-${color}`;
  const cachePath = path.resolve(CACHE_DIR, `${cacheKey}.json`);

  // Return cached result if available
  try {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    if (cached.pathData) return cached;
  } catch {
    // Cache miss — proceed to fetch
  }

  try {
    const res = await fetch(`https://cdn.simpleicons.org/${slug}/${color}`);
    if (!res.ok) {
      console.warn(`  Icon 404: ${slug}/${color}`);
      return null;
    }
    const svg = await res.text();

    // Extract viewBox
    const viewBoxMatch = svg.match(/viewBox="([^"]*)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

    // Extract the first <path> element's d attribute
    const pathMatch = svg.match(/<path[^>]*\bd="([^"]*)"[^>]*>/);
    if (!pathMatch) {
      console.warn(`  Icon no path: ${slug}/${color}`);
      return null;
    }

    const result = { pathData: pathMatch[1], viewBox };

    // Cache it
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cachePath, JSON.stringify(result));
    } catch {
      // Cache write failure is non-fatal
    }

    return result;
  } catch (err) {
    console.warn(`  Icon fetch failed: ${slug}/${color}: ${err.message}`);
    return null;
  }
}

module.exports = { fetchIcon };
