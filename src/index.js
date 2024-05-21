// Import required modules
const fs = require('fs');
const data = require('./data.js');

/**
 * Read all the replacers from the replacers directory and create an object
 * with the replacers' name as key and the replacer function as value
 * @returns {Object} The object containing all the replacers
 */
const replacers = fs
  .readdirSync('./src/replacers') // Get all files in the replacers directory
  .filter((file) => file.endsWith('js')) // Filter only the files ending with .js
  .reduce((acc, cur) => {
    // Create an object with the replacer name as key and the replacer function as value
    acc[cur.slice(0, -3)] = require('./replacers/' + cur);
    return acc;
  }, {});

/**
 * Update the README file with the generated content
 */
(async function updateREADME() {
  fs.readFile('README_TEMPLATE.md', 'utf-8', async (err, content) => {
    if (err) {
      throw err;
    }

    // Create a regex to match all the placeholders in the content
    const replacementRegex = new RegExp(`%{(${Object.keys(replacers).join('|')})}`, 'gm');

    /**
     * Replace all the placeholders in the content with the corresponding replacer function
     * @param {string} str - The content to replace
     * @param {RegExp} regex - The regex to match the placeholders
     * @param {Function} asyncFn - The async function to replace the placeholders
     * @returns {Promise<string>} - The content with the placeholders replaced
     */
    async function replaceAsync(str, regex, asyncFn) {
      const promises = [];
      str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
      });
      const data = await Promise.all(promises);
      return str.replace(regex, () => data.shift());
    }

    // Replace all the placeholders in the content with the corresponding replacer function
    const updatedMd = await replaceAsync(content, replacementRegex, async (e) => {
      return await replacers[e.slice(2, -1)](data);
    });

    // Write the updated content to the README file
    fs.writeFile('README.md', updatedMd, 'utf-8', (err) => {
      if (err) {
        throw err;
      }
      console.log('README update complete.');
    });
  });
})();

