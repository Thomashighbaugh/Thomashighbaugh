const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const header = require('./resources/header.js');
const socialMedias = require('./resources/socialMedias.js');
const skillswall = require('./resources/skillswall.js');
const randomFollower = require('./resources/randomFollower.js');
const starredSection = require('./resources/starred.js'); // Import the new starred section

async function generateReadme() {
  try {
    const template = await readFile('./README_TEMPLATE.md', 'utf-8');

    // Generate the actual content using placeholders
    const readmeContent = template
      .replace('%{header}', header)
      .replace('%{socialMedias}', socialMedias)
      .replace('%{skillswall}', skillswall)
      .replace('%{randomFollower}', randomFollower)
      .replace('%{starredSection}', starredSection); // Replace placeholder

    await writeFile('./README.md', readmeContent, 'utf-8');
    console.log('README.md generated successfully!');
  } catch (err) {
    console.error('Error generating README.md:', err);
  }
}

generateReadme();
