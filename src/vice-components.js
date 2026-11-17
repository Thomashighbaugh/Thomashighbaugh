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
 * Measure the advance width of a string in a given font.
 * Uses the font's real glyph metrics so pills and buttons size to their
 * content instead of a character-count estimate.
 *
 * @param {string} text
 * @param {string} fontName
 * @param {number} fontSize
 * @returns {number} Width in pixels
 */
function measureText(text, fontName, fontSize) {
  const font = getFont(fontName);
  if (!font) return text.length * fontSize * 0.55;
  let width = 0;
  for (const char of String(text)) {
    const glyph = font.charToGlyph(char);
    width += glyph && glyph.advanceWidth
      ? (glyph.advanceWidth / font.unitsPerEm) * fontSize
      : fontSize * 0.55;
  }
  return width;
}

/**
 * Truncate text so it fits a pixel width, appending an ellipsis when cut.
 *
 * @param {string} text
 * @param {string} fontName
 * @param {number} fontSize
 * @param {number} maxWidth
 * @returns {string}
 */
function truncateToWidth(text, fontName, fontSize, maxWidth) {
  const source = String(text ?? '');
  if (!source) return '';
  if (measureText(source, fontName, fontSize) <= maxWidth) return source;

  let cut = source;
  while (cut.length > 1 && measureText(`${cut}…`, fontName, fontSize) > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}…`;
}

/**
 * Wrap text to a pixel width using the font's real metrics.
 *
 * @param {string} text
 * @param {string} fontName
 * @param {number} fontSize
 * @param {number} maxWidth - Maximum line width in pixels
 * @param {number} [maxLines=3] - Maximum number of lines
 * @returns {string[]} Lines, the last one ellipsised if the text was cut
 */
function wrapText(text, fontName, fontSize, maxWidth, maxLines = 3) {
  const source = String(text ?? '').trim();
  if (!source) return [];

  const words = source.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureText(candidate, fontName, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === 0) return [];
  if (lines.length === maxLines && measureText(lines[maxLines - 1], fontName, fontSize) > maxWidth - 8) {
    // The last line was cut mid-way — trim it back and add an ellipsis.
    let last = lines[maxLines - 1];
    while (last.length > 1 && measureText(`${last}…`, fontName, fontSize) > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}

/**
 * Compute skill pill width.
 */
function skillPillWidth(name, hasIcon = false, fontSize = 11, height = 24) {
  const padX = 8;
  const iconSize = height * 0.6;
  const iconW = hasIcon ? iconSize + 6 : 0;
  const textW = measureText(String(name ?? ''), 'VT323', fontSize);
  return Math.ceil(iconW + padX + textW + padX);
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
 * Render an icon as SVG markup.
 * Icons are normalised to a 0 0 24 24 box by the fetcher, so `size` is the
 * rendered edge length in pixels.
 *
 * @param {{paths: Array<{d: string, fill: string}>, transform: string}|null} icon
 * @param {number} x - Left edge
 * @param {number} y - Top edge
 * @param {number} size - Edge length in pixels
 * @param {string} [fallbackFill] - Fill for paths without their own
 * @returns {string}
 */
function iconMarkup(icon, x, y, size, fallbackFill = '#ffffff') {
  if (!icon || !icon.paths || !icon.paths.length) return '';
  const scale = size / 24;
  const parts = icon.paths
    .map((p) => `<path d="${p.d}" fill="${p.fill || fallbackFill}" />`)
    .join('');
  // The fetcher's transform maps the source viewBox onto 0 0 24 24.
  const norm = icon.transform ? `<g transform="${icon.transform}">${parts}</g>` : parts;
  return `<g transform="translate(${x},${y}) scale(${scale})">${norm}</g>`;
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
 * Badge — SVG string.
 */
function badge({ label, value, color = COLORS.primary, logoColor = COLORS.white, icon, style = 'plastic', height = 28, fontSize = 11 }) {
  const isForTheBadge = style === 'for-the-badge';
  const borderRadius = isForTheBadge ? 4 : height / 2;
  const padX = isForTheBadge ? 8 : 6;
  const hasValue = value !== undefined && value !== null && String(value) !== '';
  const labelText = String(label ?? '');
  const valueText = hasValue ? String(value) : '';

  // Measure with the real font metrics so the pill fits its text exactly.
  const labelTextW = measureText(labelText, 'VT323', fontSize);
  const valueTextW = hasValue ? measureText(valueText, 'VT323', fontSize) : 0;
  const iconW = icon ? height * 0.6 + 6 : 0;

  const labelW = labelTextW + padX * 2;
  const valueW = hasValue ? valueTextW + padX * 2 : 0;
  const totalW = Math.ceil(labelW + valueW + iconW);
  const labelX = iconW + padX;
  const valueX = labelX + labelTextW + padX * 2;

  const labelPaths = textToPathStrings(labelText, 'VT323', fontSize, labelX, height * 0.62, logoColor);
  const valuePaths = hasValue
    ? textToPathStrings(valueText, 'VT323', fontSize, valueX, height * 0.62, logoColor)
    : [];

  let svg = `<svg width="${totalW}" height="${height}" viewBox="0 0 ${totalW} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${totalW}" height="${height}" fill="${color}" rx="${borderRadius}" ry="${borderRadius}" />`;
  if (icon) {
    svg += iconMarkup(icon, padX, (height - height * 0.6) / 2, height * 0.6, logoColor);
  }
  svg += labelPaths.join('');
  svg += valuePaths.join('');
  svg += `</svg>`;

  // The <a> wrapper lives in the Markdown around the <img>, never inside the
  // SVG: a non-<svg> root element makes the file an invalid image document.
  return svg;
}

module.exports = { Badge: badge, SocialButton: socialButton, SkillPill: skillPill, RepoCard: repoCard, FollowerCard: followerCard, StatsCard: statsCard, MetricsPanel: metricsPanel, CategoryWall: categoryWall, LANGUAGE_COLORS, skillPillWidth, truncate, textToPathStrings };

/**
 * SocialButton — SVG string.
 */
function socialButton({ icon, text, backgroundColor = '#1c1c1c', textColor = '#F2f2f2', fontSize = 15, width, height = 36 }) {
  const borderRadius = height / 2;
  const iconSize = height * 0.5;
  const padX = 12;
  const textX = icon ? padX + iconSize + 8 : padX;

  // Measure with the same font the text is drawn in (Knewave).
  const textW = measureText(String(text ?? ''), 'Knewave', fontSize);
  const totalW = width || Math.ceil(textX + textW + padX);

  const textPaths = textToPathStrings(text, 'Knewave', fontSize, textX, height * 0.55, textColor);

  let svg = `<svg width="${totalW}" height="${height}" viewBox="0 0 ${totalW} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${totalW}" height="${height}" fill="${backgroundColor}" rx="${borderRadius}" ry="${borderRadius}" />`;
  if (icon) {
    svg += iconMarkup(icon, padX, (height - iconSize) / 2, iconSize, textColor);
  }
  svg += textPaths.join('');
  svg += `</svg>`;

  return svg;
}

/**
 * SkillPill — SVG string.
 */
function skillPill({ name, icon, color = COLORS.primary, logoColor = COLORS.white, highlighted = false, fontSize = 11, height = 24, width }) {
  const fill = highlighted ? COLORS.secondary : color;
  // The accent fill is light, so the text and icon must be dark to stay legible.
  const fg = highlighted ? COLORS.black : logoColor;
  const padX = 8;
  const iconSize = height * 0.6;
  // The icon box is exactly as wide as the icon it holds.
  const iconW = icon ? iconSize + 6 : 0;
  const textX = iconW + padX;

  // Size the pill to its text using real font metrics.
  const textW = measureText(String(name ?? ''), 'VT323', fontSize);
  const totalW = width || Math.ceil(textX + textW + padX);

  const textPaths = textToPathStrings(name, 'VT323', fontSize, textX, height * 0.62, fg);

  let svg = `<svg width="${totalW}" height="${height}" viewBox="0 0 ${totalW} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${totalW}" height="${height}" fill="${fill}" rx="${height / 2}" ry="${height / 2}" />`;
  if (icon) {
    svg += iconMarkup(icon, padX, (height - iconSize) / 2, iconSize, fg);
  }
  svg += textPaths.join('');
  svg += `</svg>`;
  return svg;
}

/**
 * RepoCard — SVG string.
 */
function repoCard({ _name, fullName, description, stars, forks, language, languageColor, width = 240, height = 120 }) {
  const namePaths = textToPathStrings(fullName.split('/').pop(), 'VT323', 12, 12, 22, COLORS.secondary);

  // Wrap the description to the card width so it never overflows the frame.
  const descFont = 'VT323';
  const descSize = 10;
  const descLineHeight = 12;
  const maxDescW = width - 24;
  const descLines = wrapText(description || '', descFont, descSize, maxDescW, 3);

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="#0d0d0d" rx="4" ry="4" stroke="#30363d" stroke-width="1" />`;
  svg += namePaths.join('');

  descLines.forEach((line, i) => {
    svg += textToPathStrings(line, descFont, descSize, 12, 40 + i * descLineHeight, COLORS.white).join('');
  });

  // Star glyph — drawn as a path because VT323 has no U+2605.
  const starPath = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
    }
    return `M ${pts.join(' L ')} Z`;
  };

  // Fork glyph — three tines on a stem, drawn as a path for the same reason.
  const forkPath = (x, y) => {
    const tine = (tx) => `M ${tx} ${y} L ${tx} ${y + 5}`;
    return `${tine(x)} M ${x + 3.5} ${y} L ${x + 3.5} ${y + 3} M ${x + 7} ${y} L ${x + 7} ${y + 5} M ${x} ${y + 5} L ${x + 7} ${y + 5} M ${x + 3.5} ${y + 3} L ${x + 3.5} ${y + 8}`;
  };

  const statY = height - 14;
  let cursorX = 12;
  if (language) {
    svg += `<rect x="12" y="${statY - 8}" width="8" height="8" fill="${languageColor || LANGUAGE_COLORS[language] || COLORS.primary}" rx="2" ry="2" />`;
    cursorX = 24;
  }
  svg += `<path d="${starPath(cursorX + 4, statY - 4, 4)}" fill="#8b949e" />`;
  cursorX += 12;
  svg += textToPathStrings(String(stars), 'VT323', 9, cursorX, statY, '#8b949e').join('');
  cursorX += measureText(String(stars), 'VT323', 9) + 8;
  svg += `<path d="${forkPath(cursorX, statY - 8)}" fill="none" stroke="#8b949e" stroke-width="1" stroke-linecap="round" />`;
  cursorX += 12;
  svg += textToPathStrings(String(forks), 'VT323', 9, cursorX, statY, '#8b949e').join('');

  svg += `</svg>`;

  return svg;
}

/**
 * FollowerCard — SVG string.
 */
function followerCard({ icon, login = '', name = '', bio = '', publicRepos = 0, followers = 0, width = 340, height = 210 }) {
  const displayName = name || login || 'Follower';
  const cardW = width;
  const cardH = height;
  const avatarSize = Math.min(72, cardH * 0.4);
  const avatarX = (cardW - avatarSize) / 2;
  const avatarY = 12;

  const nameSize = 18;
  const bioSize = 11;
  const statsSize = 10;
  const nameW = measureText(displayName, 'Knewave', nameSize);
  const nameX = (cardW - nameW) / 2;

  const namePaths = displayName ? textToPathStrings(displayName, 'Knewave', nameSize, nameX, avatarY + avatarSize + 22, COLORS.white) : [];

  // Bio wraps inside the card so it never spills past the frame.
  const bioLines = wrapText(bio || '', 'VT323', bioSize, cardW - 28, 2);

  const statsText = `${publicRepos} repos / ${followers} followers`;
  const statsPaths = textToPathStrings(statsText, 'VT323', statsSize, 14, cardH - 14, COLORS.lightPrimary);

  let svg = `<svg width="${cardW}" height="${cardH}" viewBox="0 0 ${cardW} ${cardH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${cardW}" height="${cardH}" fill="#0d0d0d" rx="8" ry="8" stroke="#30363d" stroke-width="1" />`;
  if (icon) {
    svg += iconMarkup(icon, avatarX, avatarY, avatarSize, COLORS.secondary);
  }
  // textToPathStrings returns ready-made <path> elements, already positioned.
  svg += namePaths.join('');
  bioLines.forEach((line, i) => {
    svg += textToPathStrings(line, 'VT323', bioSize, 14, avatarY + avatarSize + 44 + i * 13, COLORS.lightPrimary).join('');
  });
  svg += statsPaths.join('');
  svg += `</svg>`;

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
    const valueText = value.toLocaleString();
    const valueW = measureText(valueText, 'VT323', 20);
    svg += textToPathStrings(valueText, 'VT323', 20, x + statW / 2 - valueW / 2, 40, COLORS.secondary).join('');
    const labelW = measureText(labels[i], 'VT323', 10);
    svg += textToPathStrings(labels[i], 'VT323', 10, x + statW / 2 - labelW / 2, 64, COLORS.white).join('');
  });
  svg += `</svg>`;
  return svg;
}

/**
 * MetricsPanel — SVG string.
 */
function metricsPanel({ totalStars = 0, totalForks = 0, totalRepos = 0, totalCommits = 0, languages = [], width = 500, height }) {
  const statLabels = ['Stars', 'Forks', 'Repos', 'Commits'];
  const statValues = [totalStars, totalForks, totalRepos, totalCommits];
  const panelW = width;
  const statsHeight = 86;
  const labelX = 12;
  const barX = 150;
  const barMaxW = panelW - barX - 16;

  // The panel grows with the number of language rows so nothing is clipped.
  const rowsH = languages.length ? 38 + languages.length * 22 : 0;
  const panelH = height || statsHeight + rowsH + 12;

  let svg = `<svg width="${panelW}" height="${panelH}" viewBox="0 0 ${panelW} ${panelH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${panelW}" height="${panelH}" fill="#0d0d0d" rx="8" ry="8" stroke="#30363d" stroke-width="1" />`;
  svg += `<rect x="0" y="0" width="${panelW}" height="${statsHeight}" fill="#0d0d0d" rx="8" ry="8" />`;
  svg += `<rect x="0" y="${statsHeight}" width="${panelW}" height="2" fill="#30363d" />`;

  statValues.forEach((value, i) => {
    const x = i * 125;
    const isLast = i === statValues.length - 1;
    svg += `<rect x="${x}" y="0" width="125" height="${statsHeight}" fill="#0d0d0d" rx="4" ry="4"${isLast ? '' : ' stroke="#30363d" stroke-width="1"'} />`;
    const valueText = value.toLocaleString();
    const valueW = measureText(valueText, 'VT323', 20);
    svg += textToPathStrings(valueText, 'VT323', 20, x + 62.5 - valueW / 2, statsHeight / 2 - 6, COLORS.secondary).join('');
    const labelW = measureText(statLabels[i], 'VT323', 9);
    svg += textToPathStrings(statLabels[i], 'VT323', 9, x + 62.5 - labelW / 2, statsHeight / 2 + 14, COLORS.white).join('');
  });

  svg += textToPathStrings('Most used languages', 'VT323', 10, labelX, statsHeight + 18, COLORS.lightPrimary).join('');

  const topCount = languages[0]?.count || 1;
  languages.forEach((lang, i) => {
    const y = statsHeight + 38 + i * 22;
    const pct = Math.max(6, Math.round(((lang.count || 0) / topCount) * 100));
    const barW = Math.min(barMaxW, (barMaxW * pct) / 100);
    const color = LANGUAGE_COLORS[lang.name] || COLORS.primary;

    svg += `<rect x="${labelX}" y="${y - 8}" width="8" height="8" fill="${color}" rx="2" ry="2" />`;

    // The language name is clipped to the space before the bar starts.
    const nameX = labelX + 14;
    const nameMaxW = barX - nameX - 8;
    const name = truncateToWidth(lang.name, 'VT323', 10, nameMaxW);
    svg += textToPathStrings(name, 'VT323', 10, nameX, y + 2, COLORS.white).join('');

    svg += `<rect x="${barX}" y="${y - 6}" width="${barW}" height="8" fill="${color}" rx="4" ry="4" />`;
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
