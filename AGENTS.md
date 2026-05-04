<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-03 | Updated: 2026-05-03 -->

# Thomashighbaugh

## Purpose
GitHub Profile README generator that uses GitHub Actions to run Node.js scripts. Dynamically generates a rich profile README with follower showcases, skill walls, recent works, social media links, and account statistics via template replacement.

## Key Files
| File | Description |
|------|-------------|
| `package.json` | Project scripts, dependencies (sharp, node-fetch, date-stringifier) |
| `pnpm-workspace.yaml` | pnpm workspace configuration |
| `README_TEMPLATE.md` | Template with `%{replacername}` placeholders for dynamic content |
| `README.md` | Generated profile README (output of `npm start`) |
| `github-metrics.svg` | Large SVG metrics visualization |
| `CONTRIBUTING.md` | Contribution guidelines |
| `.prettierrc` | Prettier code formatting configuration |
| `.gitignore` | Git ignore rules |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/` | Application source code (see `src/AGENTS.md`) |
| `.github/` | GitHub Actions workflows and documentation (see `.github/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Run `npm start` to test README generation locally (requires GITHUB_TOKEN env)
- Run `npm test` for Mocha tests
- Template replacement uses `%{replacername}` syntax in `README_TEMPLATE.md`
- Replacers are auto-discovered from `src/replacers/`

### Testing Requirements
- Mocha test suite: `npm test`
- Verify README generation: `npm start` then check `README.md` output

### Common Patterns
- Template-driven architecture: `README_TEMPLATE.md` + replacers = `README.md`
- Each replacer handles one template tag and returns replacement content
- Bitmap fonts (Coder 18/30/48) and web fonts for SVG rendering

## Dependencies

### Internal
- `src/` - Core application logic

### External
- sharp - Image processing for SVG/PNG rendering
- node-fetch - GitHub API calls
- date-stringifier - Date formatting for experience timeline

<!-- MANUAL: -->
