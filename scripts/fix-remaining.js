const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'frontend', 'public', 'images');

async function main() {
  // Fix dining-table-3.webp - it's 1920x1920, 932KB, needs size reduction
  const diningTable3Path = path.join(IMAGES_DIR, 'dining-table-3.webp');
  const tempPath = path.join(__dirname, 'dining-table-3-temp.webp'); // temp in scripts dir
  
  try {
    await sharp(diningTable3Path)
      .webp({ quality: 70 })
      .toFile(tempPath);
    fs.unlinkSync(diningTable3Path);
    fs.renameSync(tempPath, diningTable3Path);
    console.log('Fixed dining-table-3.webp (reduced quality to 70%)');
  } catch (e) {
    console.error('Error fixing dining-table-3.webp:', e.message);
  }

  console.log('Done fixing remaining images');
}

main().catch(console.error);