// @ts-check

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.resolve('.opencode/skills/taste-skill/.icons-cache');

/* Gil Barbara's repository has no tags or releases, so the source is pinned to a commit.
   jsDelivr serves gh/<user>/<repo>@<commit>/<path>; the logos are logos/<name>.svg. */
const LOGOS_SHA = 'd6960edc1b7309d392c76e40d3a320df7f9ff85c';
const GH = `https://cdn.jsdelivr.net/gh/gilbarbara/logos@${LOGOS_SHA}/`;
const CDN = 'https://cdn.jsdelivr.net/npm/';
const SI_VER = '16.30.0';

const logoFileUrl = (n) => GH + 'logos/' + n + '.svg';
const siIcon = (s) => `${CDN}simple-icons@${SI_VER}/icons/${s}.svg`;

fs.mkdirSync(CACHE_DIR, { recursive: true });

async function fetchCached(url) {
  const f = path.join(CACHE_DIR, url.replace(/^https:\/\//, '').replace(/[^a-z0-9.@-]+/gi, '_'));
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const t = await r.text();
  fs.writeFileSync(f, t);
  return t;
}

/**
 * Resolve a Simple Icons slug to { pathData, viewBox }.
 * Tries multiple sources: Simple Icons first (one-colour brand marks), then
 * Gil Barbara logos (full-colour). Falls back to null if unavailable.
 *
 * @param {string} slug - Simple Icons slug (e.g. 'discord', 'x', 'javascript')
 * @param {string} color - Hex color without # (e.g. '5865f2')
 * @returns {Promise<{pathData: string, viewBox: string} | null>}
 */
async function fetchIcon(slug, _color = 'ffffff') {
  // Try Simple Icons first (one-colour marks painted in brand hex)
  try {
    const svg = await fetchCached(siIcon(slug));
    const viewBoxMatch = svg.match(/viewBox="([^"]*)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
    const pathMatch = svg.match(/<path[^>]*\bd="([^"]*)"[^>]*>/);
    if (pathMatch) {
      return { pathData: pathMatch[1], viewBox };
    }
  } catch {
    // Fall through to logos
  }

  // Try Gil Barbara logos (full-colour SVGs)
  try {
    const svg = await fetchCached(logoFileUrl(slug));
    const viewBoxMatch = svg.match(/viewBox="([^"]*)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
    const pathMatch = svg.match(/<path[^>]*\bd="([^"]*)"[^>]*>/);
    if (pathMatch) {
      return { pathData: pathMatch[1], viewBox };
    }
  } catch {
    // Icon not available
  }

  return null;
}

module.exports = { fetchIcon };
