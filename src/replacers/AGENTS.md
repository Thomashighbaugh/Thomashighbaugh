<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-03 | Updated: 2026-05-03 -->

# replacers

## Purpose
Template replacer modules that handle dynamic content injection into `README_TEMPLATE.md`. Each module exports a function that takes data and returns a string to replace the corresponding `%{replacername}` tag.

## Key Files
| File | Description |
|------|-------------|
| `header.js` | Generates the profile header banner section |
| `myexperience.js` | Generates the experience timeline from data |
| `randomFollower.js` | Fetches and displays a random follower of the day |
| `randomNum.js` | Generates random numbers for display |
| `recentworks.js` | Lists recent GitHub works and projects |
| `skillswall.js` | Generates the skill badges wall |
| `socialMedias.js` | Renders social media link badges |

## For AI Agents

### Working In This Directory
- Each file exports a single async function: `module.exports = async (data) => { ... }`
- Functions receive the `data.js` export object
- Return value is a string (typically HTML/Markdown) inserted at the template tag

### Testing Requirements
- Test each replacer with mock data
- Verify template tag format: `%{replacername}` matches filename (without .js)

### Common Patterns
- Single-function modules exporting async handlers
- Use `data` object for all dynamic content
- Return HTML strings with inline styles for GitHub Markdown rendering

## Dependencies

### Internal
- `src/data.js` - Source data for all replacers
- `src/index.js` - Orchestrates replacement via regex matching

<!-- MANUAL: -->
