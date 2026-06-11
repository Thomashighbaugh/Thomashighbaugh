// @ts-check

/**
 * Random number replacer — returns a random number between 0 and 1000.
 * @type {import('../types').ReplacerFunction}
 */
module.exports = function () {
  return Math.random() * 1000;
};
