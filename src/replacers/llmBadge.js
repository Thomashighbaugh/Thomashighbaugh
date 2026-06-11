// @ts-check

const { generateBadge } = require('../utils/generateBadge');
const theme = require('../theme');

/**
 * Local LLM setup badge replacer.
 * @type {import('../types').ReplacerFunction}
 */
module.exports = async function () {
  const { colors } = theme;

  const badges = [
    generateBadge({
      name: 'local llm',
      message: 'ollama',
      color: colors.secondary,
      logo: 'ollama',
      style: 'plastic',
      logoColor: colors.white,
    }),
    generateBadge({
      name: 'model',
      message: 'deepseek-v4-flash:cloud',
      color: colors.primary,
      logo: 'deepseek',
      style: 'plastic',
      logoColor: colors.white,
    }),
    generateBadge({
      name: 'context',
      message: '1M tokens',
      color: colors.lightPrimary,
      logo: 'githubactions',
      style: 'plastic',
      logoColor: colors.white,
    }),
  ];

  return `<p align="center">${badges.join('\n')}</p>`;
};
