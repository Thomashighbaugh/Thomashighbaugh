// @ts-check

const sharp = require('sharp');
const dateStringifier = require('date-stringifier');
const fs = require('fs').promises;

/**
 * Composite a follower's avatar onto a CoderBase image template.
 * Falls back gracefully if assets are missing.
 * @param {import('../types').GitHubFollower} follower
 * @param {string} fileName - Output filename (e.g. 'randomFollower.png')
 * @returns {Promise<string|null>} The fileName on success, null on failure
 */
async function drawFollowerImage(follower, fileName) {
  try {
    // Check if required mask/base files exist before starting
    const maskExists = await fs.access('./src/resources/images/levelMask.png').then(() => true).catch(() => false);
    const baseExists = await fs.access('./src/resources/images/CoderBase.png').then(() => true).catch(() => false);

    if (!maskExists || !baseExists) {
      console.warn('Skipping image compositing: required assets (levelMask.png / CoderBase.png) not found');
      return null; // signal to fall back to plain img
    }

    // 1. Fetch and Decode Avatar
    let avatarBuffer;
    try {
      const response = await fetch(follower.avatar_url);
      avatarBuffer = Buffer.from(await response.arrayBuffer());
    } catch (fetchError) {
      console.error('Error fetching avatar:', fetchError);
      try {
        avatarBuffer = await fs.readFile('./src/resources/images/default_avatar.png');
      } catch (fallbackError) {
        console.error('Error reading fallback avatar:', fallbackError);
        return null; // Exit if both fail
      }
    }

    // 2. Resize Avatar
    const resizedAvatarBuffer = await sharp(avatarBuffer).resize(269, 269).toBuffer();

    // 3. Load Avatar Mask
    let maskBuffer;
    try {
      maskBuffer = await fs.readFile('./src/resources/images/levelMask.png');
    } catch (maskError) {
      console.error('Error reading mask:', maskError);
      return null;
    }

    // 4. Apply mask to make avatar circular
    // The levelMask.png is RGB (3 channels), so use its grayscale values as the
    // alpha channel of the avatar. Brighter pixels = more opaque.
    const grayMask = await sharp(maskBuffer).greyscale().toBuffer();
    const maskedAvatarBuffer = await sharp(resizedAvatarBuffer)
      .joinChannel(grayMask)
      .toBuffer();

    // 5. Load CoderBase
    let baseBuffer;
    try {
      baseBuffer = await fs.readFile('./src/resources/images/CoderBase.png');
    } catch (baseError) {
      console.error('Error reading base image:', baseError);
      return null;
    }

    // 6. Composite Avatar onto Base with text overlay
    const baseImage = sharp(baseBuffer);
    const baseMetadata = await baseImage.metadata();
    const width = baseMetadata.width || 900;
    const height = baseMetadata.height || 300;
    const formattedDate = dateStringifier(new Date(follower.created_at), `Joined {MM}/{DD}/{yy}`);

    const textSvg = `
<svg width="${width}" height="${height}">
  <style>
    .name { fill: #fff; font-size: 18px; font-family: sans-serif; font-weight: bold; }
    .date { fill: #ccc; font-size: 13px; font-family: sans-serif; }
  </style>
  <text x="150" y="270" text-anchor="middle" class="name">${follower.login}</text>
  <text x="150" y="288" text-anchor="middle" class="date">${formattedDate}</text>
</svg>`;
    const textOverlay = await sharp(Buffer.from(textSvg)).toBuffer();

    const composedImageBuffer = await baseImage.composite([
      { input: maskedAvatarBuffer, top: 18, left: 16 },
      { input: textOverlay, top: 0, left: 0 }
    ]).toBuffer();

    // 7. Save the final Image

    await fs.writeFile(`./src/resources/images/${fileName}`, composedImageBuffer);
    return fileName;
  } catch (error) {
    console.error('General error in drawFollowerImage:', error);
    return null;
  }
}

module.exports = { drawFollowerImage };
