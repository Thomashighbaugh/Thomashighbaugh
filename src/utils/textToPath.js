// @ts-check

const fs = require('fs');
const path = require('path');
const opentype = require('@shuding/opentype.js');

const FONTS_DIR = path.resolve('src/resources/fonts');

/**
 * Load a font file and parse it with opentype.js.
 * Accepts .woff2, .woff, .ttf, .otf.
 * @param {string} fontName - font family name (e.g. 'VT323', 'Knewave')
 * @returns {opentype.Font | null}
 */
function loadFont(fontName) {
  // Find the font file
  let fontFile = null;
  if (fs.existsSync(FONTS_DIR)) {
    for (const dir of fs.readdirSync(FONTS_DIR, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const subDir = path.join(FONTS_DIR, dir.name);
      for (const file of fs.readdirSync(subDir, { withFileTypes: true })) {
        if (!file.isFile()) continue;
        const ext = path.extname(file.name).toLowerCase();
        if (['.woff2', '.woff', '.ttf', '.otf'].includes(ext)) {
          const baseName = path.basename(file.name, ext)
            .replace(/[-_](Regular|Bold|Italic|Light|Medium|SemiBold|ExtraBold|Black|\d+)/gi, '')
            .replace(/\s+/g, ' ');
          if (baseName === fontName) {
            fontFile = path.join(subDir, file.name);
            break;
          }
        }
      }
      if (fontFile) break;
    }
  }

  if (!fontFile) return null;

  try {
    const buf = fs.readFileSync(fontFile);
    const data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    return opentype.parse(data);
  } catch {
    return null;
  }
}

/**
 * Convert a text string to SVG path elements.
 * Returns an array of { d, x, y, fill, fontSize } objects that can be
 * rendered as <path> elements inside an SVG.
 *
 * @param {string} text - text to convert
 * @param {string} fontName - font family name
 * @param {number} fontSize - font size in px
 * @param {number} x - x position
 * @param {number} y - y position (baseline)
 * @param {string} [fill='currentColor'] - fill color
 * @returns {Array<{d: string, x: number, y: number, fill: string, fontSize: number}>}
 */
function textToPaths(text, fontName, fontSize, x, y, fill = 'currentColor') {
  const font = loadFont(fontName);
  if (!font) return [];

  const paths = [];
  let currentX = x;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyph = font.charToGlyph(char);
    if (!glyph) {
      currentX += fontSize * 0.6; // advance for missing glyph
      continue;
    }

    const path = glyph.getPath(currentX, y, fontSize);
    const svgPath = path.toSVG();
    const dMatch = svgPath.match(/d="([^"]*)"/);
    if (dMatch) {
      paths.push({
        d: dMatch[1],
        x: currentX,
        y,
        fill,
        fontSize,
      });
    }

    currentX += glyph.advanceWidth ? glyph.advanceWidth / font.unitsPerEm * fontSize : fontSize * 0.6;
  }

  return paths;
}

module.exports = { textToPaths, loadFont };
