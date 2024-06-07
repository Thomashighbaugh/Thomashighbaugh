/**
 * Update the README.md file with the values from the replacers.
 */
(async function updateREADME() {
  // Read the README_TEMPLATE.md file
  const content = (await fs.promises.readFile('README_TEMPLATE.md', 'utf-8'))
    .split(/\r?\n/);

  // Create a regular expression to match all the replacer tags in the README_TEMPLATE.md file
  const replacementRegex = new RegExp(`%{(${Object.keys(replacers).join('|')})}`, 'gm');
  const replacements = await Promise.all(
    content.map(async (line) => {
      if (replacementRegex.test(line)) {
        return await replacers[line.match(replacementRegex)[1].slice(2, -1)](data);
      }
      return line;
    }),
  );

  // Write the updated content to the README.md file
  await fs.promises.writeFile('README.md', replacements.join('\n'));
  console.log('README update complete.');
})();



