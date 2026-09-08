import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filmDir = path.join(__dirname, '../apps/web/public/film');
const outputDir = path.join(__dirname, '../apps/web/public/film-ultra-hd');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Ultra HD resolution (4K)
const ULTRA_HD_WIDTH = 3840;
const ULTRA_HD_HEIGHT = 2160;

// Get all JPG files
const files = fs.readdirSync(filmDir).filter(file => file.endsWith('.jpg'));

console.log(`Found ${files.length} images to convert...`);

for (const file of files) {
  const inputPath = path.join(filmDir, file);
  const outputPath = path.join(outputDir, file.replace('.jpg', '.png'));
  
  try {
    console.log(`Processing ${file}...`);
    
    // Get original image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`  Original: ${metadata.width}x${metadata.height}`);
    
    // Calculate aspect ratio
    const aspectRatio = metadata.width / metadata.height;
    
    // Calculate new dimensions maintaining aspect ratio
    let newWidth = ULTRA_HD_WIDTH;
    let newHeight = Math.round(newWidth / aspectRatio);
    
    // If height exceeds Ultra HD, scale by height instead
    if (newHeight > ULTRA_HD_HEIGHT) {
      newHeight = ULTRA_HD_HEIGHT;
      newWidth = Math.round(newHeight * aspectRatio);
    }
    
    console.log(`  Upscaling to: ${newWidth}x${newHeight}`);
    
    // Process image: upscale to Ultra HD and convert to PNG
    await sharp(inputPath)
      .resize(newWidth, newHeight, {
        fit: 'cover',
        kernel: sharp.kernel.lanczos3, // High-quality upscaling kernel
        withoutEnlargement: false
      })
      .png({
        quality: 100,
        compressionLevel: 6,
        adaptiveFiltering: true
      })
      .toFile(outputPath);
    
    console.log(`  ✓ Saved as ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`  ✗ Error processing ${file}:`, error.message);
  }
}

console.log('\n✅ Conversion complete!');
console.log(`Ultra HD PNG images saved to: ${outputDir}`);
