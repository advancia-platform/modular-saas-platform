/**
 * Script to generate favicon and icon assets
 * Run with: node scripts/generate-icons.mjs
 */

import sharp from "sharp";

// SVG template for the Advancia logo
const logoSvg = `
<svg width="512" height="512" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6" />
      <stop offset="50%" style="stop-color:#06b6d4" />
      <stop offset="100%" style="stop-color:#14b8a6" />
    </linearGradient>
    <linearGradient id="gradient2" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" style="stop-color:#06b6d4" />
      <stop offset="100%" style="stop-color:#3b82f6" />
    </linearGradient>
    <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#14b8a6" />
      <stop offset="100%" style="stop-color:#06b6d4" />
    </linearGradient>
  </defs>
  
  <!-- Outer hexagon -->
  <path d="M50 5 L85 27.5 L85 72.5 L50 95 L15 72.5 L15 27.5 Z" 
        stroke="url(#gradient1)" stroke-width="3" fill="none"/>
  
  <!-- Financial chart line -->
  <path d="M30 70 L40 55 L50 60 L60 40 L70 45" 
        stroke="url(#gradient3)" stroke-width="2.5" 
        stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  
  <!-- Currency symbol -->
  <path d="M50 25 L50 75" stroke="url(#gradient2)" stroke-width="2" stroke-linecap="round"/>
  <path d="M42 32 C42 28 45 25 50 25 C55 25 58 28 58 32 C58 36 55 38 50 38" 
        stroke="url(#gradient2)" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M50 62 C55 62 58 65 58 69 C58 73 55 75 50 75 C45 75 42 73 42 69" 
        stroke="url(#gradient2)" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>
`;

const sizes = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 48, name: "favicon-48x48.png" },
  { size: 192, name: "android-chrome-192x192.png" },
  { size: 512, name: "android-chrome-512x512.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 150, name: "mstile-150x150.png" },
];

async function generateIcons() {
  console.log("🎨 Generating icon assets...\n");

  const svgBuffer = Buffer.from(logoSvg);

  for (const { size, name } of sizes) {
    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png()
        .toFile(`frontend/public/${name}`);

      console.log(`✅ Generated ${name}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  console.log("\n✨ Icon generation complete!");
}

generateIcons().catch(console.error);
