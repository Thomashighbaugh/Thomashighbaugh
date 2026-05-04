<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-03 | Updated: 2026-05-03 -->

# src

## Purpose
Core application source code for the GitHub Profile README generator. Contains the main entry point, data definitions, theme configuration, template replacer modules, and utility functions.

## Key Files
| File | Description |
|------|-------------|
| `index.js` | Main entry point — reads template, discovers replacers, performs async replacement, writes README.md |
| `data.js` | Source data including social links, experience timeline, skill definitions, recent works |
| `theme.js` | Theme configuration (colors, styles) used across replacers |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `replacers/` | Template replacer modules (see `replacers/AGENTS.md`) |
| `utils/` | Utility functions for image generation and API calls (see `utils/AGENTS.md`) |
| `resources/` | Static assets — fonts and images (see `resources/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `index.js` auto-discovers replacers from `replacers/` directory
- Replacers are loaded dynamically via `fs.readdirSync`
- Data is passed to each replacer function as argument

### Testing Requirements
- Unit tests under `npm test` (Mocha)

### Common Patterns
- Async template replacement with `Promise.all` for parallel processing
- Dynamic module loading from `replacers/` directory
- Template tags follow `%{replacername}` convention

## Dependencies

### Internal
- `data.js` - Central data store used by all replacers
- `theme.js` - Theme config used by replacers and utils

### External
- fs (Node.js) - File system operations
- sharp - Image processing (used via utils)
- node-fetch - GitHub API (used via utils)

<!-- MANUAL: -->
