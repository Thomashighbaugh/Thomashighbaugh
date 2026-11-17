// @ts-check

const fs = require('fs');
const path = require('path');
const opentype = require('@shuding/opentype.js');

const theme = require('./theme');

const COLORS = theme.colors;

// Accent lifted from banner.svg: the footer "GITHUB PROFILE README" line is
// #5ad4e6. Button text and the icons inside those buttons use it verbatim.
const ACCENT = '#5ad4e6';

// Every label on a button/pill is set in Black Han Sans: its heavy strokes stay
// legible at the small sizes a README renders at.
const BUTTON_FONT = 'BlackHanSans';

// Corner radius shared by every button so the header badges, social buttons
// and skill pills read as one set.
const BUTTON_RADIUS = 5;

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
  return text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text;
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
  if (!font) return String(text).length * fontSize * 0.55;
  // Measure the normalised string so widths match what is actually drawn.
  const normalized = normalizeForFont(text, font);
  let width = 0;
  for (const char of normalized) {
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
  while (cut.length > 1 && measureText(`${cut}...`, fontName, fontSize) > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}...`;
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
  let i = 0;

  while (i < words.length && lines.length < maxLines) {
    const candidate = current ? `${current} ${words[i]}` : words[i];
    if (measureText(candidate, fontName, fontSize) <= maxWidth) {
      current = candidate;
      i++;
      continue;
    }
    if (current) {
      lines.push(current);
      current = '';
      continue;
    }
    // A single word wider than the line — hard-break it.
    lines.push(truncateToWidth(words[i], fontName, fontSize, maxWidth));
    i++;
  }

  if (current && lines.length < maxLines) lines.push(current);

  // Anything left over was cut: mark the last line so it does not read as a
  // complete sentence.
  if (i < words.length && lines.length) {
    const lastIndex = lines.length - 1;
    let cut = lines[lastIndex];
    while (cut.length > 1 && measureText(`${cut}...`, fontName, fontSize) > maxWidth) {
      cut = cut.slice(0, -1);
    }
    lines[lastIndex] = `${cut.trimEnd()}...`;
  }

  return lines;
}

/**
 * Compute skill pill width.
 */
function skillPillWidth(name, hasIcon = false, fontSize = 15, height = 30) {
  const padX = 9;
  const iconSize = height * 0.58;
  const iconW = hasIcon ? iconSize + 7 : 0;
  const textW = measureText(String(name ?? ''), BUTTON_FONT, fontSize);
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
 * Characters the outline fonts lack, mapped to safe ASCII equivalents.
 * Black Han Sans (and VT323) carry no U+2026/U+2014/U+00B7 glyphs, and a
 * missing glyph is silently drawn as nothing — text would vanish rather than
 * degrade. Everything is normalised before measuring or drawing.
 */
const GLYPH_FALLBACKS = {
  '…': '...',
  '—': '-',
  '–': '-',
  '·': '-',
  '•': '-',
  '“': '"',
  '”': '"',
  '‘': "'",
  '’': "'",
  '→': '->',
  '←': '<-',
  '★': '*',
  '☆': '*',
};

/**
 * Replace characters the font cannot draw with readable ASCII.
 *
 * @param {string} text
 * @param {import('@shuding/opentype.js').Font | null} font
 * @returns {string}
 */
function normalizeForFont(text, font) {
  const source = String(text ?? '');
  if (!font) return source;
  let out = '';
  for (const char of source) {
    const glyph = font.charToGlyph(char);
    if (glyph && glyph.index !== 0) {
      out += char;
      continue;
    }
    if (GLYPH_FALLBACKS[char] !== undefined) {
      out += GLYPH_FALLBACKS[char];
    } else if (char === ' ') {
      out += ' ';
    }
    // Anything else with no glyph is dropped rather than rendering a blank.
  }
  return out;
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
 * @param {string} [fill] - Colour every path is painted in
 * @returns {string}
 */
function iconMarkup(icon, x, y, size, fill = ACCENT) {
  if (!icon || !icon.paths || !icon.paths.length) return '';
  const scale = size / 24;
  // Every path is painted in the caller's colour: brand-coloured logos would
  // otherwise break the "icon matches the label" rule.
  const parts = icon.paths
    .map((p) => `<path d="${p.d}" fill="${fill}" />`)
    .join('');
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
  const source = normalizeForFont(text, font);
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const glyph = font.charToGlyph(char);
    if (!glyph || glyph.index === 0) {
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
function badge({ label, value, color = COLORS.primary, logoColor = '#ffffff', icon, style = 'plastic', height = 34, fontSize = 16, border, borderWidth = 1.5 }) {
  const isForTheBadge = style === 'for-the-badge';
  const borderRadius = isForTheBadge ? BUTTON_RADIUS : height / 2;
  const padX = isForTheBadge ? 10 : 9;
  const hasValue = value !== undefined && value !== null && String(value) !== '';
  const labelText = String(label ?? '');
  const valueText = hasValue ? String(value) : '';

  // Measure with the real font metrics so the pill fits its text exactly.
  const labelTextW = measureText(labelText, BUTTON_FONT, fontSize);
  const valueTextW = hasValue ? measureText(valueText, BUTTON_FONT, fontSize) : 0;
  const iconSize = height * 0.62;
  const iconW = icon ? iconSize + 7 : 0;

  const labelW = labelTextW + padX * 2;
  const valueW = hasValue ? valueTextW + padX * 2 : 0;
  const totalW = Math.ceil(labelW + valueW + iconW);
  const labelX = iconW + padX;
  const valueX = labelX + labelTextW + padX * 2;

  // Black Han Sans puts its cap height around 0.72em; this centres the label.
  const baseline = height / 2 + fontSize * 0.36;

  const labelPaths = textToPathStrings(labelText, BUTTON_FONT, fontSize, labelX, baseline, logoColor);
  const valuePaths = hasValue
    ? textToPathStrings(valueText, BUTTON_FONT, fontSize, valueX, baseline, logoColor)
    : [];

  // The outline is inset by half its width so the SVG viewBox does not clip it.
  const inset = border ? borderWidth / 2 : 0;
  const strokeAttr = border ? ` stroke="${border}" stroke-width="${borderWidth}"` : '';

  let svg = `<svg width="${totalW}" height="${height}" viewBox="0 0 ${totalW} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="${inset}" y="${inset}" width="${totalW - inset * 2}" height="${height - inset * 2}" fill="${color}" rx="${borderRadius}" ry="${borderRadius}"${strokeAttr} />`;
  if (icon) {
    svg += iconMarkup(icon, padX, (height - iconSize) / 2, iconSize, logoColor);
  }
  svg += labelPaths.join('');
  svg += valuePaths.join('');
  svg += `</svg>`;

  // The <a> wrapper lives in the Markdown around the <img>, never inside the
  // SVG: a non-<svg> root element makes the file an invalid image document.
  return svg;
}

module.exports = { Badge: badge, SocialButton: socialButton, SkillPill: skillPill, RepoCard: repoCard, FollowerCard: followerCard, StatsCard: statsCard, MetricsPanel: metricsPanel, CategoryWall: categoryWall, BentoGrid: bentoGrid, LANGUAGE_COLORS, skillPillWidth, truncate, textToPathStrings };

/**
 * SocialButton — SVG string.
 */
function socialButton({ icon, text, backgroundColor = '#3c3c3c', textColor = '#f4f4f4', fontSize = 20, width, height = 42, border = '#f4f4f7', borderWidth = 2 }) {
  // Matches the chips under the banner in banner.svg (.list button):
  // #3c3c3c fill, #f4f4f4 label, #f4f4f7 solid border.
  const borderRadius = BUTTON_RADIUS;
  const iconSize = height * 0.52;
  const padX = 14;
  const textX = icon ? padX + iconSize + 9 : padX;

  // Measure with the same font the label is drawn in (Black Han Sans).
  const textW = measureText(String(text ?? ''), BUTTON_FONT, fontSize);
  const totalW = width || Math.ceil(textX + textW + padX);

  // Baseline for a 0.72em cap height, vertically centred.
  const baseline = height / 2 + fontSize * 0.36;
  const textPaths = textToPathStrings(text, BUTTON_FONT, fontSize, textX, baseline, textColor);

  // Inset by half the stroke so the outline is not clipped by the viewBox.
  const inset = border ? borderWidth / 2 : 0;
  const strokeAttr = border ? ` stroke="${border}" stroke-width="${borderWidth}"` : '';

  let svg = `<svg width="${totalW}" height="${height}" viewBox="0 0 ${totalW} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="${inset}" y="${inset}" width="${totalW - inset * 2}" height="${height - inset * 2}" fill="${backgroundColor}" rx="${borderRadius}" ry="${borderRadius}"${strokeAttr} />`;
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
function skillPill({ name, icon, color = '#3c3c3c', logoColor = '#f4f4f4', highlighted = false, fontSize = 15, height = 30, width }) {
  // Plain pills borrow the banner's chip styling (banner.svg .list button):
  // #3c3c3c fill, #f4f4f4 label, #f4f4f7 solid border. Highlighted pills stay
  // on the accent so they still stand out.
  const fill = highlighted ? '#222222' : color;
  const fg = highlighted ? ACCENT : logoColor;
  const stroke = highlighted ? ACCENT : '#f4f4f7';
  const borderWidth = highlighted ? 1.5 : 2;
  const inset = borderWidth / 2;
  const padX = 9;
  const iconSize = height * 0.58;
  // The icon box is exactly as wide as the icon it holds.
  const iconW = icon ? iconSize + 7 : 0;
  const textX = iconW + padX;

  // Size the pill to its text using real font metrics.
  const textW = measureText(String(name ?? ''), BUTTON_FONT, fontSize);
  const totalW = width || Math.ceil(textX + textW + padX);

  const baseline = height / 2 + fontSize * 0.36;
  const textPaths = textToPathStrings(name, BUTTON_FONT, fontSize, textX, baseline, fg);

  let svg = `<svg width="${totalW}" height="${height}" viewBox="0 0 ${totalW} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="${inset}" y="${inset}" width="${totalW - inset * 2}" height="${height - inset * 2}" fill="${fill}" rx="${BUTTON_RADIUS}" ry="${BUTTON_RADIUS}" stroke="${stroke}" stroke-width="${borderWidth}" />`;
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
function repoCard({ _name, fullName, description, stars, forks, language, languageColor, width = 260, height = 126 }) {
  const nameSize = 15;
  const namePaths = textToPathStrings(fullName.split('/').pop(), BUTTON_FONT, nameSize, 12, 26, ACCENT);

  // Wrap the description to the card width so it never overflows the frame.
  const descFont = BUTTON_FONT;
  const descSize = 12;
  const descLineHeight = 16;
  const maxDescW = width - 24;
  const descLines = wrapText(description || '', descFont, descSize, maxDescW, 3);

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="#0d0d0d" rx="4" ry="4" stroke="#30363d" stroke-width="1" />`;
  svg += namePaths.join('');

  descLines.forEach((line, i) => {
    svg += textToPathStrings(line, descFont, descSize, 12, 48 + i * descLineHeight, COLORS.white).join('');
  });

  // Star glyph — drawn as a path because the outline font has no U+2605.
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
    const tine = (tx) => `M ${tx} ${y} L ${tx} ${y + 6}`;
    return `${tine(x)} M ${x + 4} ${y} L ${x + 4} ${y + 4} M ${x + 8} ${y} L ${x + 8} ${y + 6} M ${x} ${y + 6} L ${x + 8} ${y + 6} M ${x + 4} ${y + 4} L ${x + 4} ${y + 10}`;
  };

  const statSize = 11;
  const statY = height - 15;
  let cursorX = 12;
  if (language) {
    svg += `<rect x="12" y="${statY - 9}" width="9" height="9" fill="${languageColor || LANGUAGE_COLORS[language] || COLORS.primary}" rx="2" ry="2" />`;
    cursorX = 27;
  }
  svg += `<path d="${starPath(cursorX + 5, statY - 5, 5)}" fill="#8b949e" />`;
  cursorX += 14;
  svg += textToPathStrings(String(stars), BUTTON_FONT, statSize, cursorX, statY, '#8b949e').join('');
  cursorX += measureText(String(stars), BUTTON_FONT, statSize) + 10;
  svg += `<path d="${forkPath(cursorX, statY - 10)}" fill="none" stroke="#8b949e" stroke-width="1.2" stroke-linecap="round" />`;
  cursorX += 14;
  svg += textToPathStrings(String(forks), BUTTON_FONT, statSize, cursorX, statY, '#8b949e').join('');

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
  const avatarSize = Math.min(80, cardH * 0.42);
  const avatarX = (cardW - avatarSize) / 2;
  const avatarY = 14;

  const nameSize = 26;
  const bioSize = 14;
  const statsSize = 12;
  const nameW = measureText(displayName, BUTTON_FONT, nameSize);
  const nameX = (cardW - nameW) / 2;
  const nameY = avatarY + avatarSize + 30;

  const namePaths = displayName
    ? textToPathStrings(displayName, BUTTON_FONT, nameSize, nameX, nameY, ACCENT)
    : [];

  // Bio wraps inside the card so it never spills past the frame.
  const bioLines = wrapText(bio || '', BUTTON_FONT, bioSize, cardW - 28, 2);

  const statsText = `${publicRepos} repos / ${followers} followers`;
  const statsPaths = textToPathStrings(statsText, BUTTON_FONT, statsSize, 14, cardH - 16, COLORS.lightPrimary);

  let svg = `<svg width="${cardW}" height="${cardH}" viewBox="0 0 ${cardW} ${cardH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${cardW}" height="${cardH}" fill="#0d0d0d" rx="8" ry="8" stroke="#30363d" stroke-width="1" />`;
  if (icon) {
    svg += iconMarkup(icon, avatarX, avatarY, avatarSize, ACCENT);
  }
  // textToPathStrings returns ready-made <path> elements, already positioned.
  svg += namePaths.join('');
  bioLines.forEach((line, i) => {
    svg += textToPathStrings(line, BUTTON_FONT, bioSize, 14, nameY + 22 + i * 19, COLORS.lightPrimary).join('');
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
  const statW = 110;
  const cardH = 110;

  let svg = `<svg width="${statW * 4}" height="${cardH}" viewBox="0 0 ${statW * 4} ${cardH}" xmlns="http://www.w3.org/2000/svg">`;
  values.forEach((value, i) => {
    const x = i * statW;
    const isLast = i === values.length - 1;
    svg += `<rect x="${x}" y="0" width="${statW}" height="${cardH}" fill="#0d0d0d" rx="4" ry="4"${isLast ? '' : ' stroke="#30363d" stroke-width="1"'} />`;
    const valueText = value.toLocaleString();
    const valueW = measureText(valueText, BUTTON_FONT, 28);
    svg += textToPathStrings(valueText, BUTTON_FONT, 28, x + statW / 2 - valueW / 2, 50, ACCENT).join('');
    const labelW = measureText(labels[i], BUTTON_FONT, 13);
    svg += textToPathStrings(labels[i], BUTTON_FONT, 13, x + statW / 2 - labelW / 2, 78, COLORS.white).join('');
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
  const statW = panelW / 4;
  const statsHeight = 96;
  const labelX = 14;
  const barX = 170;
  const barMaxW = panelW - barX - 16;
  const rowH = 28;

  // The panel grows with the number of language rows so nothing is clipped.
  const rowsH = languages.length ? 44 + languages.length * rowH : 0;
  const panelH = height || statsHeight + rowsH + 14;

  let svg = `<svg width="${panelW}" height="${panelH}" viewBox="0 0 ${panelW} ${panelH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${panelW}" height="${panelH}" fill="#0d0d0d" rx="8" ry="8" stroke="#30363d" stroke-width="1" />`;
  svg += `<rect x="0" y="0" width="${panelW}" height="${statsHeight}" fill="#0d0d0d" rx="8" ry="8" />`;
  svg += `<rect x="0" y="${statsHeight}" width="${panelW}" height="2" fill="#30363d" />`;

  statValues.forEach((value, i) => {
    const x = i * statW;
    const isLast = i === statValues.length - 1;
    svg += `<rect x="${x}" y="0" width="${statW}" height="${statsHeight}" fill="#0d0d0d" rx="4" ry="4"${isLast ? '' : ' stroke="#30363d" stroke-width="1"'} />`;
    const valueText = value.toLocaleString();
    const valueW = measureText(valueText, BUTTON_FONT, 28);
    svg += textToPathStrings(valueText, BUTTON_FONT, 28, x + statW / 2 - valueW / 2, statsHeight / 2 + 2, ACCENT).join('');
    const labelW = measureText(statLabels[i], BUTTON_FONT, 13);
    svg += textToPathStrings(statLabels[i], BUTTON_FONT, 13, x + statW / 2 - labelW / 2, statsHeight / 2 + 26, COLORS.white).join('');
  });

  svg += textToPathStrings('Most used languages', BUTTON_FONT, 13, labelX, statsHeight + 24, COLORS.lightPrimary).join('');

  const topCount = languages[0]?.count || 1;
  languages.forEach((lang, i) => {
    const y = statsHeight + 44 + i * rowH;
    const pct = Math.max(6, Math.round(((lang.count || 0) / topCount) * 100));
    const barW = Math.min(barMaxW, (barMaxW * pct) / 100);
    const color = LANGUAGE_COLORS[lang.name] || COLORS.primary;

    svg += `<rect x="${labelX}" y="${y - 9}" width="9" height="9" fill="${color}" rx="2" ry="2" />`;

    // The language name is clipped to the space before the bar starts.
    const nameX = labelX + 16;
    const nameMaxW = barX - nameX - 10;
    const name = truncateToWidth(lang.name, BUTTON_FONT, 12, nameMaxW);
    svg += textToPathStrings(name, BUTTON_FONT, 12, nameX, y + 2, COLORS.white).join('');

    svg += `<rect x="${barX}" y="${y - 7}" width="${barW}" height="9" fill="${color}" rx="4" ry="4" />`;
  });

  svg += `</svg>`;
  return svg;
}

/**
 * Flow pills into rows of a fixed width.
 *
 * @param {Array<{name: string, icon?: object, width?: number}>} items
 * @param {number} maxWidth
 * @param {number} pillHeight
 * @param {number} fontSize
 * @param {number} gapX
 * @returns {{placed: Array<{pill: object, x: number, y: number, w: number}>, height: number}}
 */
function layoutPills(items, maxWidth, pillHeight, fontSize, gapX) {
  const placed = [];
  const rowHeight = pillHeight + 8;
  let x = 0;
  let y = 0;

  for (const pill of items) {
    const w = pill.width || skillPillWidth(pill.name, !!pill.icon, fontSize, pillHeight);
    if (x > 0 && x + w > maxWidth) {
      x = 0;
      y += rowHeight;
    }
    placed.push({ pill, x, y, w });
    x += w + gapX;
  }

  return { placed, height: placed.length ? y + pillHeight : 0 };
}

/**
 * Read the nested backdrop pattern out of banner.svg.
 *
 * The banner tiles a small SVG (a circuit-board motif) behind its content using
 * `background-image: url("data:image/svg+xml,…")`. SVG has no background-image,
 * so the same markup is re-emitted as a <pattern> and the banner stays the
 * single source of truth for the artwork.
 *
 * @returns {{markup: string, width: number, height: number} | null}
 */
let bannerPatternCache;
function getBannerPattern() {
  if (bannerPatternCache !== undefined) return bannerPatternCache;
  bannerPatternCache = null;

  try {
    const svg = fs.readFileSync(path.resolve('src/resources/images/banner.svg'), 'utf8');
    const styleStart = svg.indexOf('<style>');
    const styleEnd = svg.indexOf('</style>');
    if (styleStart < 0 || styleEnd < 0) return null;
    const css = svg.slice(styleStart, styleEnd);

    const matches = css.matchAll(/background-image:\s*url\("data:image\/svg\+xml,([^"]+)"\)/g);
    for (const match of matches) {
      let decoded;
      try {
        decoded = decodeURIComponent(match[1]);
      } catch {
        continue;
      }
      // The page backdrop carries no `class`; the other data URIs are octicon
      // images applied to individual elements.
      if (/\bclass=/.test(decoded)) continue;

      const open = decoded.match(/<svg\b[^>]*>/);
      if (!open) continue;
      const widthMatch = open[0].match(/\bwidth='?(\d+)/);
      const heightMatch = open[0].match(/\bheight='?(\d+)/);
      const closeAt = decoded.lastIndexOf('</svg>');
      if (!widthMatch || !heightMatch || closeAt < 0) continue;

      bannerPatternCache = {
        markup: decoded.slice(open[0].length, closeAt),
        width: Number(widthMatch[1]),
        height: Number(heightMatch[1]),
      };
      return bannerPatternCache;
    }
  } catch {
    // No banner or no pattern — the wall simply keeps its flat background.
  }

  return bannerPatternCache;
}

/**
 * The banner's motion, ported for the pills.
 *
 * banner.svg sets `.list button` to `jerkup 5ms infinite, jerk 10ms infinite`
 * — a 1px vibration — and its headings carry `glitch1`, a 3px jump. Stacking
 * both on one element does not work: they all animate `transform`, so the last
 * one wins. They are therefore split across two nested groups, whose transforms
 * compose. Each pill gets a negative delay so they drift out of phase instead
 * of twitching in unison.
 */
const PILL_MOTION_CSS = `
@keyframes vice-jerk { 0% { transform: translateY(1px); } 50% { transform: translateX(1px); } 51% { transform: translate(0, 0); } 100% { transform: translateY(-1px); } }
@keyframes vice-glitch { 0%, 30%, 32%, 98% { transform: translateX(0); } 31%, 100% { transform: translateX(3px); } }
.pill-jerk { animation: vice-jerk 10ms infinite; }
.pill-glitch { animation: vice-glitch 2.8s linear infinite; }
@media (prefers-reduced-motion: reduce) { .pill-jerk, .pill-glitch { animation: none; } }
`.replace(/\s+/g, ' ').trim();

/**
 * BentoGrid — every skill group laid out in a multi-column grid.
 *
 * Each cell is a heading plus its pills, drawn on a fully transparent canvas:
 * no panel fills, only the pills themselves. The heading is set in the same
 * face and colour as the pill labels. Groups are dropped into whichever column
 * is currently shortest, so the columns stay even.
 *
 * @param {{groups?: Array<{label: string, items: object[]}>, items?: Array<object>, width?: number, columns?: number, pillHeight?: number}} props
 * @returns {string}
 */
function bentoGrid({ groups, items, width = 800, columns = 2, pillHeight = 30 }) {
  const source = Array.isArray(groups) && groups.length
    ? groups
    : (Array.isArray(items) ? items : []);
  const data = source.filter((g) => g && Array.isArray(g.items) && g.items.length);

  const fontSize = 15;
  const labelSize = 17;
  const gapX = 9;
  const colGap = 28;
  const groupGap = 22;
  // Vertical room reserved for a heading: its cap height sits inside this band
  // so the first row is not clipped by the top edge of the canvas.
  const labelBlock = 24;
  const labelBaseline = 18;
  const labelGap = 4;
  // The wall carries the banner's own background (#1c1c1c, .screen/.menu in
  // banner.svg) and the same 6px corner GitHub puts on README images.
  const padX = 16;
  const padTop = 16;
  const padBottom = 14;
  const colW = Math.floor((width - padX * 2 - colGap * (columns - 1)) / columns);

  const colY = new Array(columns).fill(padTop);
  const cells = [];

  for (const group of data) {
    const { placed, height } = layoutPills(group.items, colW, pillHeight, fontSize, gapX);

    // Drop into the shortest column; ties go to the leftmost.
    let col = 0;
    for (let i = 1; i < columns; i++) {
      if (colY[i] < colY[col] - 0.5) col = i;
    }

    const x0 = padX + col * (colW + colGap);
    const y0 = colY[col];
    cells.push({ group, x0, y0, placed });
    colY[col] = y0 + labelBlock + labelGap + height + groupGap;
  }

  const contentH = data.length ? Math.max(...colY) - groupGap : padTop;
  const totalH = Math.ceil(contentH + padBottom);

  let svg = `<svg width="${width}" height="${totalH}" viewBox="0 0 ${width} ${totalH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<style>${PILL_MOTION_CSS}</style>`;

  // Base colour from the banner, then the banner's own tiled motif on top of it.
  const pattern = getBannerPattern();
  if (pattern) {
    svg += `<defs><pattern id="vice-banner-backdrop" width="${pattern.width}" height="${pattern.height}" patternUnits="userSpaceOnUse">${pattern.markup}</pattern></defs>`;
  }
  svg += `<rect x="0" y="0" width="${width}" height="${totalH}" fill="#1c1c1c" rx="6" ry="6" />`;
  if (pattern) {
    svg += `<rect x="0" y="0" width="${width}" height="${totalH}" fill="url(#vice-banner-backdrop)" rx="6" ry="6" />`;
  }

  let pillIndex = 0;
  for (const { group, x0, y0, placed } of cells) {
    svg += textToPathStrings(group.label, BUTTON_FONT, labelSize, x0, y0 + labelBaseline, ACCENT).join('');
    const pillTop = y0 + labelBlock + labelGap;
    for (const { pill, x, y, w } of placed) {
      // Outer group positions, the two inner groups animate — so the twitch and
      // the glitch jump compose instead of overwriting each other.
      const jerkDelay = -(((pillIndex * 0.37) % 1.6)).toFixed(2);
      const glitchDelay = -(((pillIndex * 0.83) % 2.8)).toFixed(2);
      svg += `<g transform="translate(${x0 + x},${pillTop + y})">`;
      svg += `<g class="pill-jerk" style="animation-delay:${jerkDelay}s">`;
      svg += `<g class="pill-glitch" style="animation-delay:${glitchDelay}s">`;
      svg += skillPill({
        name: pill.name,
        icon: pill.icon,
        highlighted: pill.highlighted,
        fontSize,
        height: pillHeight,
        width: w,
      }).replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
      svg += `</g></g></g>`;
      pillIndex++;
    }
  }

  svg += `</svg>`;
  return svg;
}

/**
 * Category wall — combines multiple skill pills into one SVG.
 */
function categoryWall({ items = [], width = 800, height, pillHeight = 30 }) {
  const fontSize = 15;
  const { placed, height: neededH } = layoutPills(items, width, pillHeight, fontSize, 9);
  const wallH = height ? Math.max(height, neededH) : neededH;

  let svg = `<svg width="${width}" height="${wallH}" viewBox="0 0 ${width} ${wallH}" xmlns="http://www.w3.org/2000/svg">`;
  for (const { pill, x, y, w } of placed) {
    svg += `<g transform="translate(${x},${y})">`;
    svg += skillPill({
      name: pill.name,
      icon: pill.icon,
      highlighted: pill.highlighted,
      fontSize,
      height: pillHeight,
      width: w,
    }).replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
    svg += `</g>`;
  }
  svg += `</svg>`;
  return svg;
}

module.exports = { Badge: badge, SocialButton: socialButton, SkillPill: skillPill, RepoCard: repoCard, FollowerCard: followerCard, StatsCard: statsCard, MetricsPanel: metricsPanel, CategoryWall: categoryWall, BentoGrid: bentoGrid, LANGUAGE_COLORS, skillPillWidth, truncate, textToPathStrings };
