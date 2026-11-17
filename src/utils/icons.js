// @ts-check

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.resolve('.opencode/skills/taste-skill/.icons-cache');
// Fallback cache location for CI, where .opencode/ is not present in the repo.
const CACHE_DIRS = [
  CACHE_DIR,
  path.resolve('.cache/icons'),
];

/* Gil Barbara's repository has no tags or releases, so the source is pinned to a commit.
   jsDelivr serves gh/<user>/<repo>@<commit>/<path>; the logos are logos/<name>.svg. */
const LOGOS_SHA = 'd6960edc1b7309d392c76e40d3a320df7f9ff85c';
const GH = `https://cdn.jsdelivr.net/gh/gilbarbara/logos@${LOGOS_SHA}/`;
const CDN = 'https://cdn.jsdelivr.net/npm/';
const SI_VER = '16.30.0';

const logoFileUrl = (n) => GH + 'logos/' + n + '.svg';
const siIcon = (s) => `${CDN}simple-icons@${SI_VER}/icons/${s}.svg`;

for (const dir of CACHE_DIRS) {
  fs.mkdirSync(dir, { recursive: true });
}

async function fetchCached(url) {
  const name = url.replace(/^https:\/\//, '').replace(/[^a-z0-9.@-]+/gi, '_');
  for (const dir of CACHE_DIRS) {
    const f = path.join(dir, name);
    if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  }
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const t = await r.text();
  for (const dir of CACHE_DIRS) {
    try {
      fs.writeFileSync(path.join(dir, name), t);
    } catch {
      // Cache writes are best-effort.
    }
  }
  return t;
}

/**
 * Parse an SVG document into normalised icon parts.
 *
 * Every path is returned with a transform that maps the source viewBox onto a
 * 0 0 24 24 box, so callers can scale by `size / 24` and be correct for every
 * icon regardless of its native dimensions.
 *
 * @param {string} svg - Raw SVG document
 * @param {string} fallbackColor - Fill for paths without an explicit fill
 * @returns {{ paths: Array<{d: string, fill: string}>, viewBox: string } | null}
 */
function parseIcon(svg, fallbackColor) {
  const viewBoxMatch = svg.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
  const parts = viewBox.trim().split(/[\s,]+/).map(Number);
  const [vbX, vbY, vbW, vbH] = parts.length === 4 ? parts : [0, 0, 24, 24];
  if (!vbW || !vbH) return null;

  // Scale so the larger axis fills 24 units, then centre the other axis.
  const scale = 24 / Math.max(vbW, vbH);
  const offsetX = (24 - vbW * scale) / 2 - vbX * scale;
  const offsetY = (24 - vbH * scale) / 2 - vbY * scale;

  const paths = [];
  const pathRe = /<path\b([^>]*)\/?>/g;
  let m;
  while ((m = pathRe.exec(svg)) !== null) {
    const attrs = m[1];
    const dMatch = attrs.match(/\bd="([^"]*)"/);
    if (!dMatch) continue;
    const fillMatch = attrs.match(/\bfill="([^"]*)"/);
    paths.push({
      d: dMatch[1],
      fill: fillMatch && fillMatch[1] && fillMatch[1] !== 'none' ? fillMatch[1] : fallbackColor,
    });
  }
  if (!paths.length) return null;

  return { paths, viewBox: `0 0 24 24`, transform: `translate(${offsetX} ${offsetY}) scale(${scale})` };
}

/**
 * Resolve a Simple Icons slug to normalised icon parts.
 * Tries multiple sources: Simple Icons first (one-colour brand marks), then
 * Gil Barbara logos (full-colour). Falls back to null if unavailable.
 *
 * @param {string} slug - Simple Icons slug (e.g. 'discord', 'x', 'javascript')
 * @param {string} color - Hex color without # (e.g. '5865f2')
 * @returns {Promise<{paths: Array<{d: string, fill: string}>, viewBox: string, transform: string} | null>}
 */
async function fetchIcon(slug, color = 'ffffff') {
  const fallbackColor = `#${color.replace(/^#/, '')}`;

  // Try Simple Icons first (one-colour marks painted in brand hex)
  try {
    const svg = await fetchCached(siIcon(slug));
    const parsed = parseIcon(svg, fallbackColor);
    if (parsed) return parsed;
  } catch {
    // Fall through to logos
  }

  // Try Gil Barbara logos (full-colour SVGs)
  try {
    const svg = await fetchCached(logoFileUrl(slug));
    const parsed = parseIcon(svg, fallbackColor);
    if (parsed) return parsed;
  } catch {
    // Icon not available
  }

  return null;
}

module.exports = { fetchIcon };
