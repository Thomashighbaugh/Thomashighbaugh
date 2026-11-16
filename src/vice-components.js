// @ts-check

const fs = require('fs');
const path = require('path');
const opentype = require('@shuding/opentype.js');

const theme = require('./theme');

const COLORS = theme.colors;

const FONTS_DIR = path.resolve('src/resources/fonts');

/**
 * GitHub linguist language colors.
 * @type {Record<string, string>}
 */
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Lua: '#000080',
  Rust: '#dea584',
  Go: '#00ADD8',
  Ruby: '#701516',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Dart: '#00B4AB',
  Zig: '#ec915c',
  Nix: '#7e7eff',
  'Emacs Lisp': '#c065db',
  'Vim script': '#199f4b',
  Makefile: '#427819',
  Dockerfile: '#384d54',
  PowerShell: '#012456',
  'Jupyter Notebook': '#DA5B0B',
};

/**
 * Truncate a string.
 */
function truncate(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Compute skill pill width.
 */
function skillPillWidth(name, hasIcon = false, fontSize = 11, height = 24) {
  const padX = 8;
  const textW = Math.max(name.length * fontSize * 0.55 + padX * 2, 40);
  const iconW = hasIcon ? height * 0.75 + 6 : 0;
  return Math.ceil(textW + iconW);
}

let fontCache = new Map();

function findFontFile(fontName) {
  if (!fs.existsSync(FONTS_DIR)) return null;
  // Collect all candidate files, prefer TTF/OTF over WOFF2
  let best = null;
  for (const dir of fs.readdirSync(FONTS_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const subDir = path.join(FONTS_DIR, dir.name);
    for (const file of fs.readdirSync(subDir, { withFileTypes: true })) {
      if (!file.isFile()) continue;
      const ext = path.extname(file.name).toLowerCase();
      if (!['.ttf', '.otf'].includes(ext)) continue;
      const baseName = path.basename(file.name, ext)
        .replace(/[-_](Regular|Bold|Italic|Light|Medium|SemiBold|ExtraBold|Black|\d+)/gi, '')
        .replace(/\s+/g, ' ');
      if (baseName === fontName) return path.join(subDir, file.name);
    }
  }
  return best;
}

function getFont(fontName) {
  if (fontCache.has(fontName)) return fontCache.get(fontName);
  const file = findFontFile(fontName);
  if (!file) { fontCache.set(fontName, null); return null; }
  try {
    const buf = fs.readFileSync(file);
    const data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const font = opentype.parse(data);
    fontCache.set(fontName, font);
    return font;
  } catch {
    fontCache.set(fontName, null);
    return null;
  }
}

/**
 * Convert text to SVG path element strings.
 * Paths are already positioned at (x, y) by opentype.js.
 */
function textToPathStrings(text, fontName, fontSize, x, y, fill = 'currentColor') {
  const font = getFont(fontName);
  if (!font) return [];
  const paths = [];
  let currentX = x;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyph = font.charToGlyph(char);
    if (!glyph) {
      currentX += fontSize * 0.6;
      continue;
    }
    const p = glyph.getPath(currentX, y, fontSize);
    const d = p.commands.map(cmd => {
      if (cmd.type === 'M') return `M ${cmd.x} ${cmd.y}`;
      if (cmd.type === 'L') return `L ${cmd.x} ${cmd.y}`;
      if (cmd.type === 'Q') return `Q ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`;
      if (cmd.type === 'C') return `C ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`;
      if (cmd.type === 'Z') return 'Z';
      return '';
    }).filter(Boolean).join(' ');
    paths.push(`<path d="${d}" fill="${fill}" />`);
    currentX += glyph.advanceWidth ? glyph.advanceWidth / font.unitsPerEm * fontSize : fontSize * 0.6;
  }
  return paths;
}

/**
 * Escape text for SVG attribute.
 */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Badge — SVG string.
 */
function badge({ label, value, color = COLORS.primary, logoColor = COLORS.white, icon, href, style = 'plastic', height = 28, fontSize = 11 }) {
  const isForTheBadge = style === 'for-the-badge';
  const borderRadius = isForTheBadge ? 4 : height / 2;
  const padX = isForTheBadge ? 8 : 6;
  const labelW = Math.max(label.length * fontSize * 0.55 + padX * 2, 40);
  const valueW = Math.max(String(value).length * fontSize * 0.55 + padX * 2, 30);
  const iconW = icon ? height * 0.75 + 4 : 0;
  const totalW = labelW + valueW + iconW + 4;
  const labelX = iconW + padX;
  const valueX = labelX + labelW + padX;

  const labelPaths = textToPathStrings(label, 'VT323', fontSize, labelX, height * 0.62, logoColor);
  const valuePaths = textToPathStrings(value, 'VT323', fontSize, valueX, height * 0.62, logoColor);

  let svg = `<svg width="${totalW}" height="${height}" viewBox="0 0 ${totalW} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${totalW}" height="${height}" fill="${color}" rx="${borderRadius}" ry="${borderRadius}" />`;
  if (icon) {
    svg += `<g transform="translate(${padX},${(height - height * 0.6) / 2}) scale(${height * 0.6 / 24})"><path d="${icon.pathData}" fill="${logoColor}" /></g>`;
  }
  svg += labelPaths.join('');
  svg += valuePaths.join('');
  svg += `</svg>`;

  if (href) {
    return `<a href="${esc(href)}">${svg}</a>`;
  }
  return svg;
}

module.exports = { Badge: badge, SocialButton: socialButton, SkillPill: skillPill, RepoCard: repoCard, FollowerCard: followerCard, StatsCard: statsCard, MetricsPanel: metricsPanel, CategoryWall: categoryWall, LANGUAGE_COLORS, skillPillWidth, truncate, textToPathStrings };

/**
 * SocialButton — SVG string.
 */
function socialButton({ icon, text, href, backgroundColor = '#1c1c1c', textColor = '#F2f2f2', fontSize = 15, width = 150, height = 36 }) {
  const borderRadius = height / 2;
  const iconSize = height * 0.5;
  const textX = icon ? 12 + iconSize + 8 : 12;
  const textPaths = textToPathStrings(text, 'Knewave', fontSize, textX, height * 0.55, textColor);

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="${backgroundColor}" rx="${borderRadius}" ry="${borderRadius}" />`;
  if (icon) {
    svg += `<g transform="translate(${12},${(height - iconSize) / 2}) scale(${iconSize / 24})"><path d="${icon.pathData}" fill="${textColor}" /></g>`;
  }
  svg += textPaths.join('');
  svg += `</svg>`;

  if (href) return `<a href="${esc(href)}">${svg}</a>`;
  return svg;
}

/**
 * SkillPill — SVG string.
 */
function skillPill({ name, icon, color = COLORS.primary, logoColor = COLORS.white, highlighted = false, fontSize = 11, height = 24, width }) {
  const fill = highlighted ? COLORS.secondary : color;
  const totalW = width || skillPillWidth(name, !!icon, fontSize, height);
  const iconW = icon ? height * 0.75 + 6 : 0;
  const padX = 8;
  const textX = iconW + padX;
  const textPaths = textToPathStrings(name, 'VT323', fontSize, textX, height * 0.62, logoColor);

  let svg = `<svg width="${totalW}" height="${height}" viewBox="0 0 ${totalW} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${totalW}" height="${height}" fill="${fill}" rx="${height / 2}" ry="${height / 2}" />`;
  if (icon) {
    svg += `<g transform="translate(${padX},${(height - height * 0.6) / 2}) scale(${height * 0.6 / 24})"><path d="${icon.pathData}" fill="${logoColor}" /></g>`;
  }
  svg += textPaths.join('');
  svg += `</svg>`;
  return svg;
}

/**
 * RepoCard — SVG string.
 */
function repoCard({ _name, fullName, description, stars, forks, language, languageColor, href, width = 240, height = 120 }) {
  const namePaths = textToPathStrings(fullName.split('/').pop(), 'VT323', 12, 12, 22, COLORS.secondary);
  const descPaths = description ? textToPathStrings(truncate(description, 90), 'VT323', 10, 12, 42, COLORS.white) : [];

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="#0d0d0d" rx="4" ry="4" stroke="#30363d" stroke-width="1" />`;
  svg += namePaths.join('');
  svg += descPaths.join('');

  // Stats row
  if (language) {
    svg += `<rect x="12" y="74" width="8" height="8" fill="${languageColor || LANGUAGE_COLORS[language] || COLORS.primary}" rx="2" ry="2" />`;
    svg += textToPathStrings(language, 'VT323', 9, 24, 76, '#8b949e').join('');
    svg += textToPathStrings(`★ ${stars}`, 'VT323', 9, 24 + 6 + language.length * 4.5, 76, '#8b949e').join('');
    svg += textToPathStrings(`🍴 ${forks}`, 'VT323', 9, 24 + 6 + language.length * 4.5 + 6 + stars.toString().length * 4.5, 76, '#8b949e').join('');
  } else {
    svg += textToPathStrings(`★ ${stars}`, 'VT323', 9, 12, 76, '#8b949e').join('');
    svg += textToPathStrings(`🍴 ${forks}`, 'VT323', 9, 18 + stars.toString().length * 4.5, 76, '#8b949e').join('');
  }
  svg += `</svg>`;

  if (href) return `<a href="${esc(href)}">${svg}</a>`;
  return svg;
}

/**
 * FollowerCard — SVG string.
 */
function followerCard({ icon, login = '', name = '', bio = '', publicRepos = 0, followers = 0, href, size = 150 }) {
  const displayName = name || login || 'Follower';
  const cardW = size;
  const cardH = size + 60;
  const namePaths = displayName ? textToPathStrings(displayName, 'Knewave', 18, cardW / 2, size * 0.5 + 30, COLORS.white) : [];
  const bioPaths = bio ? textToPathStrings(bio.slice(0, 30), 'VT323', 11, cardW / 2, size * 0.5 + 44, COLORS.lightPrimary) : [];
  const statsPaths = textToPathStrings(`${publicRepos} repos · ${followers} followers`, 'VT323', 10, cardW / 2, size * 0.5 + 58, COLORS.lightPrimary);

  let svg = `<svg width="${cardW}" height="${cardH}" viewBox="0 0 ${cardW} ${cardH}" xmlns="http://www.w3.org/2000/svg">`;
  if (icon) {
    svg += `<g transform="translate(${cardW / 2 - size * 0.175},10) scale(${size * 0.35 / 24})"><path d="${icon.pathData}" fill="${COLORS.secondary}" /></g>`;
  }
  svg += namePaths.map(p => `<path d="${p.d}" fill="${p.fill}" transform="translate(${p.x},${p.y})" />`).join('');
  svg += bioPaths.map(p => `<path d="${p.d}" fill="${p.fill}" transform="translate(${p.x},${p.y})" />`).join('');
  svg += statsPaths.map(p => `<path d="${p.d}" fill="${p.fill}" transform="translate(${p.x},${p.y})" />`).join('');
  svg += `</svg>`;

  if (href) return `<a href="${esc(href)}">${svg}</a>`;
  return svg;
}

/**
 * StatsCard — SVG string.
 */
function statsCard({ totalStars, totalForks, totalRepos, totalCommits }) {
  const labels = ['Stars', 'Forks', 'Repos', 'Commits'];
  const values = [totalStars, totalForks, totalRepos, totalCommits];
  const statW = 100;

  let svg = `<svg width="400" height="100" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">`;
  values.forEach((value, i) => {
    const x = i * statW;
    const isLast = i === values.length - 1;
    svg += `<rect x="${x}" y="0" width="${statW}" height="100" fill="#0d0d0d" rx="4" ry="4"${isLast ? '' : ' stroke="#30363d" stroke-width="1"'} />`;
    svg += textToPathStrings(value.toLocaleString(), 'VT323', 20, x + statW / 2, 40, COLORS.secondary).map(p => `<path d="${p.d}" fill="${p.fill}" transform="translate(${p.x - x},${p.y - 40})" />`).join('');
    svg += textToPathStrings(labels[i], 'VT323', 10, x + statW / 2, 64, COLORS.white).map(p => `<path d="${p.d}" fill="${p.fill}" transform="translate(${p.x - x},${p.y - 64})" />`).join('');
  });
  svg += `</svg>`;
  return svg;
}

/**
 * MetricsPanel — SVG string.
 */
function metricsPanel({ totalStars = 0, totalForks = 0, totalRepos = 0, totalCommits = 0, languages = [] }) {
  const statLabels = ['Stars', 'Forks', 'Repos', 'Commits'];
  const statValues = [totalStars, totalForks, totalRepos, totalCommits];
  const statsHeight = 86;

  let svg = `<svg width="500" height="210" viewBox="0 0 500 210" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="500" height="210" fill="#0d0d0d" rx="8" ry="8" stroke="#30363d" stroke-width="1" />`;
  svg += `<rect x="0" y="0" width="500" height="${statsHeight}" fill="#0d0d0d" rx="8" ry="8" />`;
  svg += `<rect x="0" y="${statsHeight}" width="500" height="2" fill="#30363d" />`;

  statValues.forEach((value, i) => {
    const x = i * 125;
    const isLast = i === statValues.length - 1;
    svg += `<rect x="${x}" y="0" width="125" height="${statsHeight}" fill="#0d0d0d" rx="4" ry="4"${isLast ? '' : ' stroke="#30363d" stroke-width="1"'} />`;
    svg += textToPathStrings(value.toLocaleString(), 'VT323', 20, x + 62.5, statsHeight / 2 - 6, COLORS.secondary).map(p => `<path d="${p.d}" fill="${p.fill}" transform="translate(${p.x - x - 62.5},${p.y - statsHeight / 2 + 6})" />`).join('');
    svg += textToPathStrings(statLabels[i], 'VT323', 9, x + 62.5, statsHeight / 2 + 14, COLORS.white).map(p => `<path d="${p.d}" fill="${p.fill}" transform="translate(${p.x - x - 62.5},${p.y - statsHeight / 2 - 14})" />`).join('');
  });

  svg += textToPathStrings('Most used languages', 'VT323', 10, 12, statsHeight + 16, COLORS.lightPrimary).map(p => `<path d="${p.d}" fill="${p.fill}" transform="translate(${p.x - 12},${p.y - statsHeight - 16})" />`).join('');

  languages.forEach((lang, i) => {
    const y = statsHeight + 14 + i * 22;
    const pct = Math.max(6, Math.round(((lang.count || 0) / (languages[0]?.count || 1)) * 100));
    const barW = Math.min(300, pct * 3);
    svg += `<rect x="12" y="${y - 8}" width="8" height="8" fill="${LANGUAGE_COLORS[lang.name] || COLORS.primary}" rx="2" ry="2" />`;
    svg += textToPathStrings(truncate(lang.name, 14), 'VT323', 10, 24, y + 2, COLORS.white).map(p => `<path d="${p.d}" fill="${p.fill}" transform="translate(${p.x - 24},${p.y - 2})" />`).join('');
    svg += `<rect x="120" y="${y - 6}" width="${barW}" height="8" fill="${LANGUAGE_COLORS[lang.name] || COLORS.secondary}" rx="4" ry="4" />`;
  });

  svg += `</svg>`;
  return svg;
}

/**
 * Category wall — combines multiple skill pills into one SVG.
 */
function categoryWall({ items = [], width = 800, height = 300, pillHeight = 24 }) {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  let currentX = 0;
  let currentY = 0;
  const rowHeight = pillHeight + 4;

  for (const pill of items) {
    const pillW = pill.width || skillPillWidth(pill.name, !!pill.icon, 11, pillHeight);
    if (currentX + pillW > width) {
      currentX = 0;
      currentY += rowHeight;
      if (currentY + pillHeight > height) break;
    }
    svg += `<g transform="translate(${currentX},${currentY})">`;
    svg += skillPill({ name: pill.name, icon: pill.icon, highlighted: pill.highlighted, fontSize: 11, height: pillHeight, width: pillW }).replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
    svg += `</g>`;
    currentX += pillW + 8;
  }
  svg += `</svg>`;
  return svg;
}

module.exports = { Badge: badge, SocialButton: socialButton, SkillPill: skillPill, RepoCard: repoCard, FollowerCard: followerCard, StatsCard: statsCard, MetricsPanel: metricsPanel, CategoryWall: categoryWall, LANGUAGE_COLORS, skillPillWidth, truncate, textToPathStrings };
