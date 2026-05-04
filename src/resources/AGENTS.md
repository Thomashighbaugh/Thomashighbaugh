<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-03 | Updated: 2026-05-03 -->

# resources

## Purpose
Static assets directory containing bitmap fonts, web fonts, and images used for SVG generation and profile README rendering.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `fonts/` | Bitmap fonts (Coder 18/30/48) and web fonts (Knewave, Press Start 2P, Tiny5, VT323) |
| `images/` | SVG/PNG assets — banners, logos, icons, and follower images |

## For AI Agents

### Working In This Directory
- Font files are loaded by sharp for text rendering in generated images
- Bitmap fonts (.fnt + .png pairs) are custom bitmap fonts
- Web fonts (.woff2) are used for SVG rendering
- Images are referenced in the generated README

### Common Patterns
- Fonts organized by family in subdirectories
- Bitmap font pairs: `.fnt` (metrics) + `.png` (glyph atlas)

## Dependencies

### External
- sharp - Loads and renders bitmap fonts for image generation

<!-- MANUAL: -->
