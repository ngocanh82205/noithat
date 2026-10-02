const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'frontend', 'public', 'images');
const CUTOFFS_DIR = path.join(__dirname, '..', 'frontend', 'public', 'images', 'cutouts');

const MAX_WIDTH = 2000;
const MAX_SIZE_KB = 800;
const QUALITY = 80;

async function getImageInfo(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const stats = fs.statSync(filePath);
    return {
      width: metadata.width,
      height: metadata.height,
      sizeKB: stats.size / 1024,
      format: metadata.format,
    };
  } catch (e) {
    return null;
  }
}

async function processImage(filename, filePath) {
  const info = await getImageInfo(filePath);
  if (!info) return;

  const needsResize = info.width > 2500 || info.sizeKB > 800;
  const needsFormatChange = info.format !== 'webp' && info.format !== 'avif';

  if (!needsResize && !needsFormatChange) {
    console.log(`✓ ${filename} - OK (${info.width}x${info.height}, ${info.sizeKB.toFixed(0)}KB, ${info.format})`);
    return;
  }

  console.log(`Processing ${filename}...`);
  console.log(`  Before: ${info.width}x${info.height}, ${info.sizeKB.toFixed(0)}KB, ${info.format}`);

  let outputPath = filePath;
  let newFilename = filename;

  // If changing format to webp
  if (needsFormatChange) {
    newFilename = filename.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    outputPath = path.join(path.dirname(filePath), newFilename);
  }

  try {
    await sharp(filePath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const newInfo = await getImageInfo(outputPath);
    console.log(`  After: ${newInfo.width}x${newInfo.height}, ${newInfo.sizeKB.toFixed(0)}KB, webp`);

    // Remove old file if format changed
    if (needsFormatChange && outputPath !== filePath) {
      fs.unlinkSync(filePath);
      console.log(`  Removed old ${filename}`);
    }
  } catch (err) {
    console.error(`  Error processing ${filename}:`, err.message);
  }
}

async function main() {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => 
    /\.(jpg|jpeg|png|webp|avif)$/i.test(f) && !f.startsWith('.')
  );

  console.log(`Found ${files.length} images to check\n`);

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    await processImage(file, filePath);
  }

  // Check cutouts directory
  if (fs.existsSync(CUTOFFS_DIR)) {
    const cutoutFiles = fs.readdirSync(CUTOFFS_DIR).filter(f => 
      /\.(jpg|jpeg|png|webp|avif)$/i.test(f) && !f.startsWith('.')
    );
    console.log(`\nCutouts: ${cutoutFiles.length} images`);
    for (const file of cutoutFiles) {
      const filePath = path.join(CUTOFFS_DIR, file);
      await processImage(file, filePath);
    }
  }

  console.log('\n✓ Done processing all images');
}

main().catch(console.error);