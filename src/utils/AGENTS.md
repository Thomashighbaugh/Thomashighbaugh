<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-03 | Updated: 2026-05-03 -->

# utils

## Purpose
Utility functions that support image generation, badge creation, HTML element construction, and GitHub API interactions used by the replacer modules.

## Key Files
| File | Description |
|------|-------------|
| `drawFollowerImage.js` | Draws follower avatar images using sharp (bitmap compositing) |
| `generateBadge.js` | Generates skill/technology badge SVGs |
| `generateElement.js` | Creates HTML elements for template injection |
| `githubApi.js` | GitHub API client for fetching follower data, repos, etc. |

## For AI Agents

### Working In This Directory
- `drawFollowerImage.js` uses `sharp` for image processing
- `githubApi.js` uses `node-fetch` for API calls
- Utilities are imported by replacer modules

### Testing Requirements
- Mock GitHub API responses for testing
- Verify image generation outputs

### Common Patterns
- Pure utility functions, no side effects
- Image processing chain: fetch → process → composite → output
- API calls with error handling and fallbacks

## Dependencies

### Internal
- `src/theme.js` - Theme colors and styles

### External
- sharp - Image processing library
- node-fetch - HTTP client for GitHub API

<!-- MANUAL: -->
