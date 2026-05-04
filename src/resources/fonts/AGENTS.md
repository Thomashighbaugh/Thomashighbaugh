<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-03 | Updated: 2026-05-03 -->

# fonts

## Purpose
Font assets for SVG rendering and image generation. Contains bitmap fonts (Coder family in .fnt/.png format) and web fonts (Knewave, Press Start 2P, Tiny5, VT323 in .woff2 format).

## Key Files
| File | Description |
|------|-------------|
| `Coder18.fnt` / `Coder18.png` | Coder bitmap font at 18pt (metrics + glyph atlas) |
| `Coder30.fnt` / `Coder30.png` | Coder bitmap font at 30pt |
| `Coder48.fnt` / `Coder48.png` | Coder bitmap font at 48pt |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `Knewave/` | Knewave web font (.woff2 + OFL license) |
| `Press_Start_2P/` | Press Start 2P web font (.woff2 + OFL license) |
| `Tiny5/` | Tiny5 web font (.woff2 + OFL license) |
| `VT323/` | VT323 web font (.woff2 + OFL license) |

## For AI Agents

### Working In This Directory
- Bitmap fonts consist of paired .fnt (metrics/bearing) and .png (glyph bitmap atlas) files
- Web fonts are loaded for SVG text rendering
- All fonts include OFL (Open Font License) files

### Common Patterns
- Bitmap fonts loaded by sharp for bitmap text rendering
- Web fonts referenced in SVG markup via CSS `@font-face`

<!-- MANUAL: -->
