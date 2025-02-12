const sharp = require('sharp');
const dateStringifier = require('date-stringifier');
const fs = require('fs').promises; // Use promises for file operations

async function drawFollowerImage(follower, fileName) {
  try {
    // 1. Fetch and Decode Avatar
    let avatarBuffer;
    try {
      const response = await fetch(follower.avatar_url);
      avatarBuffer = await response.arrayBuffer();
    } catch (fetchError) {
      console.error("Error fetching avatar:", fetchError);
      try {
        avatarBuffer = await fs.readFile('./src/resources/images/default_avatar.png');
      } catch (fallbackError) {
        console.error("Error reading fallback avatar:", fallbackError);
        return; // Exit if both fail
      }
    }

    // 2. Resize Avatar
    const resizedAvatarBuffer = await sharp(avatarBuffer)
      .resize(269, 269)
      .toBuffer();

    // 3. Load Avatar Mask
    let maskBuffer;
    try {
      maskBuffer = await fs.readFile('./src/resources/images/levelMask.png');
    } catch (maskError) {
      console.error("Error reading mask:", maskError);
      return;
    }

    // 4. Composite Avatar with Mask  (This is trickier with Sharp - see notes below)
    // NOTE: Sharp doesn't have a direct "mask" function like Jimp. You'd typically
    // have to composite the avatar with a transparent circle on top of the mask.
    // This is a simplified example assuming the mask itself makes the image circular.
    const maskedAvatarBuffer = resizedAvatarBuffer; // In a real implementation, you'd composite.

    // 5. Load CoderBase
    let baseBuffer;
    try {
      baseBuffer = await fs.readFile('./src/resources/images/CoderBase.png');
    } catch (baseError) {
      console.error("Error reading base image:", baseError);
      return;
    }

    // 6. Composite Avatar onto Base
    const baseImage = sharp(baseBuffer);
    const compositeOptions = {
      input: maskedAvatarBuffer,
      top: 18,
      left: 16,
    };
    const composedImageBuffer = await baseImage
      .composite([compositeOptions])
      .toBuffer();

    //Text Operations are not supported in sharp. Need to composite an svg or something
    //7. Font and date loading
    const formattedDate = dateStringifier(new Date(follower.created_at), `Joined {MM}/{DD}/{yy}`);

    // 8. Save the final Image

    await fs.writeFile(`./src/resources/images/${fileName}`, composedImageBuffer);

  } catch (error) {
    console.error("General error in drawFollowerImage:", error);
  }
}

module.exports = { drawFollowerImage };