<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-03 | Updated: 2026-05-03 -->

# .github

## Purpose
GitHub configuration directory containing CI/CD workflows and supplementary documentation for the Profile README generator project.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `workflows/` | GitHub Actions workflow definitions (build, deploy, mirror) |
| `documentation/` | Supplementary docs (e.g., SVG banner guide) |

## For AI Agents

### Working In This Directory
- Workflows trigger on push to main branch and scheduled intervals
- Environment variables like `GITHUB_TOKEN` are required for API calls

### Common Patterns
- Scheduled workflows (cron) for daily README regeneration
- Mirror workflow for Codeberg synchronization

<!-- MANUAL: -->
