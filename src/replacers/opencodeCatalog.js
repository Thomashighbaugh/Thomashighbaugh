const fs = require('fs');
const path = require('path');
const theme = require('../theme');
const { generateBadge } = require('../utils/generateBadge');

/**
 * Renders the OpenCode agent/skill catalog as a README section.
 * Reads opencode-catalog.json to dynamically generate the catalog display.
 */
module.exports = async function () {
  let catalog;

  try {
    const catalogPath = path.join(__dirname, '..', '..', 'opencode-catalog.json');
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  } catch {
    return '<!-- opencode catalog data not found -->';
  }

  const { colors } = theme;
  const badges = {
    agents: generateBadge({
      name: 'agents',
      message: String(catalog.agentCount),
      color: colors.secondary,
      logo: 'githubactions',
      style: 'plastic',
      logoColor: colors.white,
    }),
    skills: generateBadge({
      name: 'skills',
      message: String(catalog.skillsCount),
      color: colors.secondary,
      logo: 'githubactions',
      style: 'plastic',
      logoColor: colors.white,
    }),
    commands: generateBadge({
      name: 'commands',
      message: String(catalog.commandsCount),
      color: colors.secondary,
      logo: 'githubactions',
      style: 'plastic',
      logoColor: colors.white,
    }),
    tools: generateBadge({
      name: 'tools',
      message: String(catalog.toolsCount),
      color: colors.secondary,
      logo: 'githubactions',
      style: 'plastic',
      logoColor: colors.white,
    }),
    plugins: generateBadge({
      name: 'plugins',
      message: String(catalog.pluginsCount),
      color: colors.secondary,
      logo: 'githubactions',
      style: 'plastic',
      logoColor: colors.white,
    }),
    model: generateBadge({
      name: 'default model',
      message: 'deepseek-v4-flash:cloud',
      color: colors.primary,
      logo: 'ollama',
      style: 'plastic',
      logoColor: colors.white,
    }),
  };

  const overviewBadges = [badges.agents, badges.skills, badges.commands, badges.tools, badges.plugins, badges.model].join('\n');

  const agentSections = Object.entries(catalog.agents)
    .map(([group, agents]) => {
      if (group === 'orchestrator') return '';
      const agentList = agents
        .map((a) => `  <li><code>${a.name}</code> &mdash; ${a.description}</li>`)
        .join('\n');
      return `<details><summary>${group.replace('_', ' ')} (${agents.length})</summary>\n<ul>\n${agentList}\n</ul>\n</details>`;
    })
    .filter(Boolean)
    .join('\n\n');

  return `
<details open>
<summary><strong>🧠 OpenCode Agent Infrastructure</strong> ${badges.agents}</summary>
<br>

<em>This profile README was generated and maintained with the assistance of my <a href="https://github.com/Thomashighbaugh/opencode">OpenCode</a> agentic orchestration system — 29 specialized AI agents, 64 skills, 6 commands, and 10 tools working in concert.</em>

<br>
<br>

<p align="center">${overviewBadges}</p>

<br>

${agentSections}

<br>

<details>
<summary>Key Agent — JOC (Joint Operations Center)</summary>
<br>
<blockquote>
<strong>joc</strong> is the primary orchestrator that plans, delegates, monitors, and integrates results from all specialist subagents. It follows an "orchestrate, don't execute" philosophy — analyzing tasks, selecting appropriate subagents, and coordinating complex multi-step workflows.
</blockquote>
</details>

</details>
`;
};
