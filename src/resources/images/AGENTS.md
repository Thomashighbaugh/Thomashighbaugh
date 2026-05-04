<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-03 | Updated: 2026-05-03 -->

# images

## Purpose
Image assets used in the generated profile README. Includes custom-designed SVG banners, logos, icons, and dynamically generated follower images.

## Key Files
| File | Description |
|------|-------------|
| `banner.svg` | Profile header banner (850x450, custom vector art) |
| `logo.svg` / `logo.png` | Personal logo in vector and raster formats |
| `icon.png` | Profile icon/avatar |
| `CoderBase.png` | Base image for Coder bitmap font rendering |
| `levelMask.png` | Mask image for level/badge overlays |
| `lastFollower.png` | Cached last displayed follower image |
| `randomFollower.png` | Current random follower of the day image |

## For AI Agents

### Working In This Directory
- SVG files are vector assets for high-quality rendering
- PNG files are generated/updated by `utils/drawFollowerImage.js`
- `randomFollower.png` is overwritten daily by GitHub Actions

### Common Patterns
- SVG for static design assets, PNG for dynamically generated content
- Follower images composited from avatar + mask + background

<!-- MANUAL: -->
