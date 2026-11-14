<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-03 | Updated: 2026-05-03 -->

# Thomashighbaugh

## Purpose
GitHub Profile README generator that uses GitHub Actions to run Node.js scripts. Dynamically generates a rich profile README with follower showcases, skill walls, recent works, social media links, and account statistics via template replacement.

## Key Files
| File | Description |
|------|-------------|
| `package.json` | Project scripts, dependencies (sharp, satori, sucrase, node-fetch, date-stringifier) |
| `pnpm-workspace.yaml` | pnpm workspace configuration |
| `readme.source.md` | Source template with ` ```vice ` JSX blocks + `%{replacername}` placeholders |
| `README_TEMPLATE.md` | Legacy template (superseded by `readme.source.md`; kept for `npm run build:legacy`) |
| `README.md` | Generated profile README (output of `npm start`) |
| `.github/assets/` | Generated vice SVG components (committed, content-hashed filenames) |
| `github-metrics.svg` | Legacy lowlighter/metrics output — no longer referenced by the README |
| `CONTRIBUTING.md` | Contribution guidelines |
| `.prettierrc` | Prettier code formatting configuration |
| `.gitignore` | Git ignore rules |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/` | Application source code (see `src/AGENTS.md`) |
| `scripts/` | Standalone utility scripts (see `scripts/AGENTS.md`) |
| `.github/` | GitHub Actions workflows and documentation (see `.github/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Run `npm start` to regenerate the README (requires GITHUB_TOKEN env for full data)
- Run `npm test` for Mocha tests
- The README is built from `readme.source.md`: ` ```vice ` blocks are rendered to
  SVG by Satori and written to `.github/assets/`; remaining `%{tag}` tags are
  filled by the replacers in `src/replacers/`
- `src/resources/fonts/*.woff2` are the outline fonts vice renders with. They
  are committed to the repo so the build works in CI with no font downloads.
  The Coder `.fnt`/`.png` bitmap fonts are for sharp only — Satori cannot use them

### Testing Requirements
- Mocha test suite: `npm test`
- Verify README generation: `npm start` then check `README.md` output

### Common Patterns
- Template-driven architecture: `readme.source.md` + vice blocks + replacers = `README.md`
- Each vice block renders to one SVG; the filename carries a content hash for cache busting
- Bitmap fonts (Coder 18/30/48) and web fonts for SVG rendering

## Dependencies

### Internal
- `src/` - Core application logic

### External
- sharp - Image processing for SVG/PNG rendering
- node-fetch - GitHub API calls
- date-stringifier - Date formatting for experience timeline

<!-- MANUAL: -->
