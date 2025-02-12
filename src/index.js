// Import required modules
const fs = require('fs');
const data = require('./data.js');

/**
 * Read all the replacers from the replacers directory and create an object
 * with the replacer name as the key and the replacer function as the value.
 * @returns {Object} An object containing all the replacer functions
 */
const replacers = fs
  .readdirSync('./src/replacers')
  .filter((file) => file.endsWith('js'))
  .reduce((acc, cur) => {
    const replacerName = cur.slice(0, -3);
    try {
      acc[replacerName] = require('./replacers/' + cur);
    } catch (error) {
      console.error(`Error loading replacer ${replacerName}:`, error);
    }
    return acc;
  }, {});

/**
 * Update the README.md file with the values from the replacers.
 */
(async function updateREADME() {
  // Read the README_TEMPLATE.md file
  fs.readFile('README_TEMPLATE.md', 'utf-8', async (err, content) => {
    if (err) {
      throw err;
    }

    // Create a regular expression to match all the replacer tags in the README_TEMPLATE.md file
    const replacementRegex = new RegExp(`%{(${Object.keys(replacers).join('|')})}`, 'gm');

    /**
     * Replace all the replacer tags in the content string with the values returned by the replacer functions.
     * @param {string} str - The string to replace the replacer tags in.
     * @param {RegExp} regex - The regular expression to match the replacer tags.
     * @param {function} asyncFn - The function to execute for each replacer tag.
     * @returns {string} - The string with the replacer tags replaced with the values returned by the replacer functions.
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

    // Replace all the replacer tags in the content string with the values returned by the replacer functions
    try {
      const updatedMd = await replaceAsync(content, replacementRegex, async (e) => {
        const replacerName = e.slice(2, -1);
        if (replacers[replacerName]) {
          return await replacers[replacerName](data);
        } else {
          console.warn(`No replacer found for tag: ${e}`);
          return e; // Return the original tag if no replacer is found
        }
      });

      // Write the updated content to the README.md file
      fs.writeFile('README.md', updatedMd, 'utf-8', (err) => {
        if (err) {
          throw err;
        }
        console.log('README update complete.');
      });
    } catch (error) {
      console.error('An error occurred during the replacement process:', error);
    }
  });
})();
