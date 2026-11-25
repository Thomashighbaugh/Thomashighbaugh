<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-03 | Updated: 2026-05-03 -->

# images

## Purpose
Image assets used in the generated profile README. Includes custom-designed SVG banners, logos, icons, and dynamically generated follower images.

## Key Files
| File | Description |
|------|-------------|
| `banner.svg` | Profile header banner (850x450, custom vector art) |
| `logo.png` | Personal logo in raster format (referenced by the legacy build template) |
| `CoderBase.png` | Base image for Coder bitmap font rendering |
| `levelMask.png` | Mask image for level/badge overlays |

## For AI Agents

### Working In This Directory
- SVG files are vector assets for high-quality rendering
- PNG files are generated/updated by `utils/drawFollowerImage.js`
- `randomFollower.png` is generated daily by GitHub Actions and written to this directory (runtime artifact, not committed source)

### Common Patterns
- SVG for static design assets, PNG for dynamically generated content
- Follower images composited from avatar + mask + background

<!-- MANUAL: -->
