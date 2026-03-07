import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const THEMES_DIR = './public/assets/themes';

async function compressDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await compressDirectory(fullPath);
    } else if (fullPath.endsWith('.webp')) {
      const originalSize = (await fs.stat(fullPath)).size;
      const tempPath = `${fullPath}.tmp.webp`;
      try {
        await sharp(fullPath)
          .resize({ width: 400, withoutEnlargement: true }) // Solitaire cards don't need to be wider than 400px
          .webp({ quality: 75, effort: 6 })
          .toFile(tempPath);
        
        const newSize = (await fs.stat(tempPath)).size;
        
        // Only replace if it's actually smaller (to avoid degrading already optimized images)
        if (newSize < originalSize) {
          await fs.rename(tempPath, fullPath);
          console.log(`[Optimized] ${fullPath} (${(originalSize/1024/1024).toFixed(2)}MB -> ${(newSize/1024/1024).toFixed(2)}MB)`);
        } else {
          await fs.unlink(tempPath);
          console.log(`[Skipped] ${fullPath} (Already optimized)`);
        }
      } catch(e) {
        console.error(`[Error] Failed to process ${fullPath}`, e.message);
        // cleanup temp file if exists
        try { await fs.unlink(tempPath); } catch(_) {}
      }
    }
  }
}

console.log('Starting batch image compression... This may take a minute for 100+ images.');
compressDirectory(THEMES_DIR).then(() => console.log('\nAll images processed!'));
