import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

const imagesToOptimize = [
  'nigerian_entrepreneur_campaign_guide_1775720710834.png',
  'transparency_trust_african_crowdfunding_1775720737123.png',
  'african_creators_marketing_meeting_1775720765531.png',
  'nigerian_tech_professional_security_1775720793415.png',
  'nigerian_digital_artist_designing_impact_1775720823018.png'
];

async function optimizeImages() {
  console.log('🚀 Starting image optimization...');

  for (const imageName of imagesToOptimize) {
    const inputPath = path.join(PUBLIC_DIR, imageName);
    const outputPath = path.join(PUBLIC_DIR, imageName.replace('.png', '.webp'));

    if (fs.existsSync(inputPath)) {
      console.log(`Optimizing: ${imageName}`);
      
      await sharp(inputPath)
        .resize(1200, null, { // Max width 1200px
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: 80 }) // 80% quality WebP
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`✅ Saved ${imageName.replace('.png', '.webp')} (${(stats.size/1024).toFixed(2)} KB)`);
    } else {
      console.warn(`⚠️ File not found: ${inputPath}`);
    }
  }

  console.log('✨ Optimization complete.');
}

optimizeImages().catch(err => {
  console.error('❌ Optimization failed:', err);
  process.exit(1);
});
