<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-03 | Updated: 2026-05-03 -->

# workflows

## Purpose
GitHub Actions workflow definitions that automate README generation, build checks, and repository mirroring.

## Key Files
| File | Description |
|------|-------------|
| `main.yml` | Main workflow — generates README content and commits to profile repo |
| `build.yaml` | CI build workflow — runs tests and linting on push |
| `codeberg_mirror.yml` | Mirror workflow — syncs repo to Codeberg |

## For AI Agents

### Working In This Directory
- Workflows use `GITHUB_TOKEN` for API access
- `main.yml` runs scheduled (cron) and on push to generate README
- `build.yaml` validates code quality and tests

### Common Patterns
- Uses `actions/checkout@v3` and `actions/setup-node@v3`
- pnpm package manager for dependency installation
- Cron-scheduled daily execution for profile updates

<!-- MANUAL: -->
