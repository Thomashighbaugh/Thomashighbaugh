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
      // .woff is accepted too: a WOFF1 file parses with opentype.js (WOFF2 does not).
      if (!['.ttf', '.otf', '.woff'].includes(ext)) continue;
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

  const avatarSize = Math.min(64, cardH * 0.34);
  const avatarX = (cardW - avatarSize) / 2;
  const avatarY = 14;

  // Banner typography: Knewave heading in the h1 pink, Tiny5 for the bio, and
  // the banner footer's Press Start 2P accent for the counters.
  const nameSize = 26;
  const bioSize = 11;
  const nameW = measureText(displayName, 'Knewave', nameSize);
  const nameX = (cardW - nameW) / 2;
  const nameY = avatarY + avatarSize + 26;

  const cleanBio = String(bio || '').trim();
  const bioLines = cleanBio ? wrapText(cleanBio, 'Tiny5', bioSize, cardW - 68, 2) : [];
  const chipPadX = 14;
  const chipPadY = 9;
  const bioLineH = 13;
  const chipTop = nameY + 10;
  const chipH = bioLines.length ? chipPadY * 2 + bioLines.length * bioLineH : 0;

  const statsText = `${publicRepos} repos / ${followers} followers`;
  const statsSize = 8;

  let svg = `<svg width="${cardW}" height="${cardH}" viewBox="0 0 ${cardW} ${cardH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<style>${MOTION_CSS}</style>`;
  svg += bannerBackdrop(cardW, cardH, 'vice-follower-backdrop');

  svg += `<g class="motion-jerk">`;
  if (icon) {
    svg += iconMarkup(icon, avatarX, avatarY, avatarSize, '#fc618d');
  }

  // Heading glitches, like the banner's h1.
  svg += `<g class="motion-glitch">`;
  svg += headingWithShadow(displayName, nameSize, nameX, nameY);
  svg += `</g>`;

  // Bio sits in a banner-button chip: #3c3c3c face, #f4f4f7 border, hard black offset.
  if (bioLines.length) {
    const longest = Math.max(...bioLines.map((line) => measureText(line, 'Tiny5', bioSize)));
    const chipW = Math.min(cardW - 32, Math.ceil(longest + chipPadX * 2));
    const chipX = (cardW - chipW) / 2;
    svg += `<rect x="${chipX + 4}" y="${chipTop + 4}" width="${chipW}" height="${chipH}" fill="#000000" rx="${BUTTON_RADIUS}" ry="${BUTTON_RADIUS}" />`;
    svg += `<rect x="${chipX}" y="${chipTop}" width="${chipW}" height="${chipH}" fill="#3c3c3c" rx="${BUTTON_RADIUS}" ry="${BUTTON_RADIUS}" stroke="#f4f4f7" stroke-width="2" />`;
    bioLines.forEach((line, i) => {
      const lineW = measureText(line, 'Tiny5', bioSize);
      svg += textToPathStrings(line, 'Tiny5', bioSize, (cardW - lineW) / 2, chipTop + chipPadY + bioLineH * (i + 1) - 3, '#f4f4f4').join('');
    });
  }

  // Counters in the banner footer's face and colour, with its own hard drop.
  const statsW = measureText(statsText, 'PressStart2P', statsSize);
  const statsX = (cardW - statsW) / 2;
  const statsY = cardH - 16;
  svg += `<g transform="translate(1,1)">${textToPathStrings(statsText, 'PressStart2P', statsSize, statsX, statsY, '#2c2c2c').join('')}</g>`;
  svg += textToPathStrings(statsText, 'PressStart2P', statsSize, statsX, statsY, '#5ad4e6').join('');

  svg += `</g>`;
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
function metricsPanel({ totalStars = 0, totalForks = 0, totalRepos = 0, totalCommits = 0, languages = [], orgs = [], width = 500, height }) {
  const statLabels = ['Stars', 'Forks', 'Repos', 'Commits'];
  const statValues = [totalStars, totalForks, totalRepos, totalCommits];
  const panelW = width;
  const labelX = 16;
  // The four headline figures are drawn as banner buttons: fill, 2px border and
  // a hard black offset, so they need a gap and room for the offset.
  const cellGap = 10;
  const cellTop = 14;
  const cellH = 84;
  const cellShadow = 6;
  const cellW = (panelW - labelX * 2 - cellGap * (statValues.length - 1)) / statValues.length;
  const statsHeight = cellTop + cellH + cellShadow;
  const barX = 176;
  const barMaxW = panelW - barX - 18;
  const rowH = 28;
  const orgRowH = 26;

  const scopes = (orgs || []).filter((o) => o && o.name);

  // The panel grows with whatever it is asked to show.
  const orgsH = scopes.length ? 40 + scopes.length * orgRowH : 0;
  const langsH = languages.length ? 44 + languages.length * rowH : 0;
  const panelH = height || statsHeight + orgsH + langsH + 18;

  let svg = `<svg width="${panelW}" height="${panelH}" viewBox="0 0 ${panelW} ${panelH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<style>${MOTION_CSS}</style>`;
  svg += bannerBackdrop(panelW, panelH, 'vice-metrics-backdrop');

  svg += `<g class="motion-jerk">`;
  statValues.forEach((value, i) => {
    const x = labelX + i * (cellW + cellGap);
    const y = cellTop;

    // Banner button: hard black offset, #3c3c3c face, 2px #f4f4f7 border.
    svg += `<rect x="${x + cellShadow}" y="${y + cellShadow}" width="${cellW}" height="${cellH}" fill="#000000" rx="${BUTTON_RADIUS}" ry="${BUTTON_RADIUS}" />`;
    svg += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="#3c3c3c" rx="${BUTTON_RADIUS}" ry="${BUTTON_RADIUS}" stroke="#f4f4f7" stroke-width="2" />`;

    // Text styling is unchanged: Knewave pink figures with the h1 drop, Tiny5 labels.
    const valueText = value.toLocaleString();
    const valueW = measureText(valueText, 'Knewave', 26);
    svg += headingWithShadow(valueText, 26, x + cellW / 2 - valueW / 2, y + cellH / 2 + 4);
    const labelW = measureText(statLabels[i], 'Tiny5', 12);
    svg += textToPathStrings(statLabels[i], 'Tiny5', 12, x + cellW / 2 - labelW / 2, y + cellH / 2 + 28, '#f4f4f4').join('');
  });
  svg += `</g>`;

  // Per-account breakdown, including the organisations.
  let cursorY = statsHeight;
  if (scopes.length) {
    cursorY += 24;
    svg += headingWithShadow('By account', 18, labelX, cursorY);
    cursorY += 8;
    const colX = panelW - 190;
    scopes.forEach((scope) => {
      cursorY += orgRowH;
      const label = truncateToWidth(scope.name, 'Tiny5', 12, colX - labelX - 12);
      svg += `<rect x="${labelX}" y="${cursorY - 9}" width="9" height="9" fill="#5ad4e6" rx="2" ry="2" />`;
      svg += textToPathStrings(label, 'Tiny5', 12, labelX + 16, cursorY, '#f4f4f4').join('');
      const figures = `${scope.repos} repos / ${scope.stars} stars / ${scope.forks} forks`;
      const figW = measureText(figures, 'Tiny5', 12);
      svg += textToPathStrings(figures, 'Tiny5', 12, panelW - 18 - figW, cursorY, '#f4f4f4').join('');
    });
    cursorY += 10;
  }

  if (languages.length) {
    cursorY += 24;
    svg += headingWithShadow('Most used languages', 18, labelX, cursorY);
    const topCount = languages[0]?.count || 1;
    languages.forEach((lang) => {
      cursorY += rowH;
      const pct = Math.max(6, Math.round(((lang.count || 0) / topCount) * 100));
      const barW = Math.min(barMaxW, (barMaxW * pct) / 100);
      const color = LANGUAGE_COLORS[lang.name] || COLORS.primary;

      svg += `<rect x="${labelX}" y="${cursorY - 9}" width="9" height="9" fill="${color}" rx="2" ry="2" />`;

      const nameX = labelX + 16;
      const nameMaxW = barX - nameX - 10;
      const name = truncateToWidth(lang.name, 'Tiny5', 12, nameMaxW);
      svg += textToPathStrings(name, 'Tiny5', 12, nameX, cursorY, '#f4f4f4').join('');

      svg += `<rect x="${barX}" y="${cursorY - 7}" width="${barW}" height="9" fill="${color}" rx="4" ry="4" />`;
    });
  }

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
const MOTION_CSS = `
@keyframes vice-jerk { 0% { transform: translateY(1px); } 50% { transform: translateX(1px); } 51% { transform: translate(0, 0); } 100% { transform: translateY(-1px); } }
@keyframes vice-glitch { 0%, 30%, 32%, 98% { transform: translateX(0); } 31%, 100% { transform: translateX(3px); } }
.motion-jerk { animation: vice-jerk 10ms infinite; }
.motion-glitch { animation: vice-glitch 2.8s linear infinite; }
@media (prefers-reduced-motion: reduce) { .motion-jerk, .motion-glitch { animation: none; } }
`.replace(/\s+/g, ' ').trim();

/**
 * Pink banner heading with the h1's hard drop shadow.
 *
 * banner.svg sets `header h1 { text-shadow: #4c4c4c 0.35rem 0.35rem; }` at
 * 66px, i.e. an offset of roughly 0.085em. The drop is drawn as a duplicate of
 * the glyph paths so it scales with whatever size the heading is set at.
 *
 * @param {string} text
 * @param {number} fontSize
 * @param {number} x
 * @param {number} y - baseline
 * @param {string} [fill] - face colour
 * @param {string} [font]
 * @returns {string}
 */
function headingWithShadow(text, fontSize, x, y, fill = '#fc618d', font = 'Knewave') {
  const offset = Math.max(2, Math.round(fontSize * 0.085));
  let out = `<g transform="translate(${offset},${offset})">`;
  out += textToPathStrings(text, font, fontSize, x, y, '#4c4c4c').join('');
  out += `</g>`;
  out += textToPathStrings(text, font, fontSize, x, y, fill).join('');
  return out;
}

/**
 * Banner-style backdrop for a panel: #1c1c1c plus the banner's tiled motif.
 *
 * @param {number} width
 * @param {number} height
 * @param {string} id - unique pattern id (one per SVG document)
 * @returns {string}
 */
function bannerBackdrop(width, height, id) {
  const pattern = getBannerPattern();
  let out = '';
  if (pattern) {
    out += `<defs><pattern id="${id}" width="${pattern.width}" height="${pattern.height}" patternUnits="userSpaceOnUse">${pattern.markup}</pattern></defs>`;
  }
  out += `<rect x="0" y="0" width="${width}" height="${height}" fill="#1c1c1c" rx="6" ry="6" />`;
  if (pattern) {
    out += `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#${id})" rx="6" ry="6" />`;
  }
  return out;
}

/**
 * LawPanel — the "Tom's Law" statement drawn as a banner-style card.
 *
 * Mirrors banner.svg: the same #1c1c1c canvas with its tiled motif, the heading
 * in Knewave at #fc618d with a #4c4c4c drop, and the statement set in Tiny5
 * inside a single chip styled like `.list button` (fill, border, black shadow).
 * The heading glitches and the chip vibrates, as the banner's h1 and buttons do.
 *
 * @param {{width?: number, title?: string, body?: string, titleSize?: number, bodySize?: number}} props
 * @returns {string}
 */
function lawPanel({ width = 800, title = "Tom's Law of Software Development", body, titleSize = 34, bodySize = 16 }) {
  const statement = body || "The more convenient, useful or helpful a software is to use, the more of a painful, tedious and/or absolutely miserable it was to develop and then iteratively refine into such a form.";

  const PINK = '#fc618d';      // banner header h1 colour
  const CHIP_FILL = '#3c3c3c';   // banner .list button
  const CHIP_INK = '#f4f4f4';
  const CHIP_BORDER = '#f4f4f7';

  const padX = 26;
  const titleBaseline = 30 + titleSize * 0.8;
  const chipTop = titleBaseline + 26;
  const chipW = width - padX * 2;
  const chipPadX = 24;
  const chipPadY = 20;
  const lineHeight = Math.round(bodySize * 1.7);
  const shadowOffset = 12;

  // Heading, smaller than the banner's own 66px display type.
  const titleW = measureText(title, 'Knewave', titleSize);
  const titleX = (width - titleW) / 2;

  // Statement, wrapped inside the chip.
  const lines = wrapText(statement, 'Tiny5', bodySize, chipW - chipPadX * 2, 6);
  const chipH = chipPadY * 2 + lines.length * lineHeight;
  const totalH = Math.ceil(chipTop + chipH + shadowOffset + 10);

  let svg = `<svg width="${width}" height="${totalH}" viewBox="0 0 ${width} ${totalH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<style>${MOTION_CSS}</style>`;

  svg += bannerBackdrop(width, totalH, 'vice-law-backdrop');

  // Heading: hard drop, then the face itself, with the banner's glitch.
  svg += `<g class="motion-jerk"><g class="motion-glitch">`;
  svg += headingWithShadow(title, titleSize, titleX, titleBaseline, PINK);
  svg += `</g></g>`;

  // Chip: black offset block first, then the bordered face, then the text.
  svg += `<g class="motion-jerk">`;
  svg += `<rect x="${padX + shadowOffset}" y="${chipTop + shadowOffset}" width="${chipW}" height="${chipH}" fill="#000000" rx="${BUTTON_RADIUS}" ry="${BUTTON_RADIUS}" />`;
  svg += `<rect x="${padX}" y="${chipTop}" width="${chipW}" height="${chipH}" fill="${CHIP_FILL}" rx="${BUTTON_RADIUS}" ry="${BUTTON_RADIUS}" stroke="${CHIP_BORDER}" stroke-width="2" />`;
  lines.forEach((line, i) => {
    const lineW = measureText(line, 'Tiny5', bodySize);
    const lineX = padX + (chipW - lineW) / 2;
    const lineY = chipTop + chipPadY + (i + 1) * lineHeight - Math.round(lineHeight * 0.28);
    svg += textToPathStrings(line, 'Tiny5', bodySize, lineX, lineY, CHIP_INK).join('');
  });
  svg += `</g>`;

  svg += `</svg>`;
  return svg;
}

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
function bentoGrid({ groups, items, width = 800, columns = 2, pillHeight = 30, title = '' }) {
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

  // Optional banner h1 at the top, matching the other panels.
  const heading = String(title || '').trim();
  const titleSize = 30;
  const titleBaseline = padTop + titleSize * 0.8;
  const titleBlock = heading ? Math.round(titleSize * 0.8) + 30 : 0;

  const colY = new Array(columns).fill(padTop + titleBlock);
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

  const contentH = data.length ? Math.max(...colY) - groupGap : padTop + titleBlock;
  const totalH = Math.ceil(contentH + padBottom);

  let svg = `<svg width="${width}" height="${totalH}" viewBox="0 0 ${width} ${totalH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<style>${MOTION_CSS}</style>`;

  svg += bannerBackdrop(width, totalH, 'vice-banner-backdrop');

  if (heading) {
    const headingW = measureText(heading, 'Knewave', titleSize);
    svg += `<g class="motion-jerk"><g class="motion-glitch">`;
    svg += headingWithShadow(heading, titleSize, (width - headingW) / 2, titleBaseline);
    svg += `</g></g>`;
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
      svg += `<g class="motion-jerk" style="animation-delay:${jerkDelay}s">`;
      svg += `<g class="motion-glitch" style="animation-delay:${glitchDelay}s">`;
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

/**
 * ActivityPanel — recent public activity on a banner-style canvas.
 */
function activityPanel({ items = [], width = 800, title = 'Recent Activity', maxRows = 12 }) {
  const rows = (items || []).slice(0, maxRows);
  const padX = 26;
  const titleSize = 30;
  const rowSize = 13;
  const rowH = 23;
  const titleBaseline = 30 + titleSize * 0.8;
  const rowsTop = titleBaseline + 20;
  const totalH = Math.ceil(rowsTop + Math.max(rows.length, 1) * rowH + 12);

  let svg = `<svg width="${width}" height="${totalH}" viewBox="0 0 ${width} ${totalH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<style>${MOTION_CSS}</style>`;
  svg += bannerBackdrop(width, totalH, 'vice-activity-backdrop');

  // Nothing may paint outside the card, however long a line gets.
  svg += `<defs><clipPath id="vice-activity-clip"><rect x="0" y="0" width="${width}" height="${totalH}" rx="6" ry="6" /></clipPath></defs>`;
  svg += `<g clip-path="url(#vice-activity-clip)">`;

  const titleW = measureText(title, 'Knewave', titleSize);
  svg += `<g class="motion-jerk"><g class="motion-glitch">`;
  svg += headingWithShadow(title, titleSize, (width - titleW) / 2, titleBaseline);
  svg += `</g></g>`;

  // Bullet plus one line of text, trimmed to whatever room is left.
  const textX = padX + 17;
  const lineMaxW = width - textX - padX;

  svg += `<g class="motion-jerk">`;
  if (!rows.length) {
    svg += textToPathStrings('No recent public activity.', 'Tiny5', rowSize, padX, rowsTop + rowSize, '#f4f4f4').join('');
  }
  rows.forEach((item, i) => {
    const y = rowsTop + i * rowH + rowSize;
    const text = `${item.action || ''} ${item.repo || ''}${item.detail ? ` ${item.detail}` : ''}${item.ago ? ` - ${item.ago}` : ''}`;
    const label = truncateToWidth(text.replace(/\s+/g, ' ').trim(), 'Tiny5', rowSize, lineMaxW);
    svg += `<rect x="${padX}" y="${y - 9}" width="9" height="9" fill="#5ad4e6" rx="2" ry="2" />`;
    svg += textToPathStrings(label, 'Tiny5', rowSize, textX, y, '#f4f4f4').join('');
  });
  svg += `</g>`;
  svg += `</g>`;

  svg += `</svg>`;
  return svg;
}

/**
 * ProjectsGrid — every followed repository on one canvas, each drawn as a chip
 * in the banner's button style (#3c3c3c fill, #f4f4f7 border, black offset).
 */
function projectsGrid({ items = [], width = 800, title = "Projects I'm Following", columns = 2 }) {
  const repos = items || [];
  const padX = 26;
  const gapX = 18;
  const gapY = 18;
  const titleSize = 30;
  const chipW = Math.floor((width - padX * 2 - gapX * (columns - 1)) / columns);
  const chipH = 120;
  const shadow = 8;
  const titleBaseline = 30 + titleSize * 0.8;
  const gridTop = titleBaseline + 22;

  const rows = Math.ceil(repos.length / columns);
  const totalH = Math.ceil(gridTop + Math.max(rows, 1) * (chipH + gapY) + shadow + 6);

  let svg = `<svg width="${width}" height="${totalH}" viewBox="0 0 ${width} ${totalH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<style>${MOTION_CSS}</style>`;
  svg += bannerBackdrop(width, totalH, 'vice-projects-backdrop');

  const titleW = measureText(title, 'Knewave', titleSize);
  svg += `<g class="motion-jerk"><g class="motion-glitch">`;
  svg += headingWithShadow(title, titleSize, (width - titleW) / 2, titleBaseline);
  svg += `</g></g>`;

  repos.forEach((repo, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = padX + col * (chipW + gapX);
    const y = gridTop + row * (chipH + gapY);
    const jerkDelay = -(((i * 0.37) % 1.6)).toFixed(2);

    const name = truncateToWidth(repo.fullName ? repo.fullName.split('/').pop() : (repo.name || ''), 'Tiny5', 16, chipW - 32);
    const descLines = wrapText(repo.description || '', 'Tiny5', 12, chipW - 32, 2);
    const statsText = `${repo.stars ?? 0} stars / ${repo.forks ?? 0} forks${repo.language ? ` / ${repo.language}` : ''}`;

    svg += `<g transform="translate(${x},${y})">`;
    svg += `<g class="motion-jerk" style="animation-delay:${jerkDelay}s">`;
    svg += `<rect x="${shadow}" y="${shadow}" width="${chipW}" height="${chipH}" fill="#000000" rx="${BUTTON_RADIUS}" ry="${BUTTON_RADIUS}" />`;
    svg += `<rect x="0" y="0" width="${chipW}" height="${chipH}" fill="#3c3c3c" rx="${BUTTON_RADIUS}" ry="${BUTTON_RADIUS}" stroke="#f4f4f7" stroke-width="2" />`;
    svg += textToPathStrings(name, 'Tiny5', 16, 16, 30, '#f4f4f4').join('');
    descLines.forEach((line, li) => {
      svg += textToPathStrings(line, 'Tiny5', 12, 16, 54 + li * 18, '#f4f4f4').join('');
    });
    svg += textToPathStrings(truncateToWidth(statsText, 'Tiny5', 10, chipW - 32), 'Tiny5', 10, 16, chipH - 16, '#5ad4e6').join('');
    svg += `</g></g>`;
  });

  svg += `</svg>`;
  return svg;
}

module.exports = { Badge: badge, SocialButton: socialButton, SkillPill: skillPill, RepoCard: repoCard, FollowerCard: followerCard, StatsCard: statsCard, MetricsPanel: metricsPanel, CategoryWall: categoryWall, BentoGrid: bentoGrid, LawPanel: lawPanel, ActivityPanel: activityPanel, ProjectsGrid: projectsGrid, LANGUAGE_COLORS, skillPillWidth, truncate, textToPathStrings };
