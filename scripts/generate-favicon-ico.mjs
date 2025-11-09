/**
 * Generate favicon.ico from PNG files
 * Run with: node scripts/generate-favicon-ico.mjs
 */

import { readFileSync, writeFileSync } from "fs";

async function generateFavicon() {
  console.log("🎨 Generating favicon.ico...\n");

  try {
    // Read the 32x32 PNG (standard favicon size)
    const png32 = readFileSync("frontend/public/favicon-32x32.png");

    // Sharp doesn't natively support .ico format, so we'll use the PNG as is
    // Modern browsers support PNG favicons directly
    // For true .ico support, you'd need a library like 'to-ico'

    // Copy the 32x32 PNG as favicon.ico (browsers accept PNG format)
    writeFileSync("frontend/public/favicon.ico", png32);

    console.log(
      "✅ Generated favicon.ico (PNG format - compatible with modern browsers)"
    );
    console.log(
      "📝 Note: For legacy IE support, use an online converter to create multi-resolution .ico"
    );
    console.log("✨ Favicon generation complete!\n");
  } catch (error) {
    console.error("❌ Failed to generate favicon.ico:", error.message);
  }
}

generateFavicon().catch(console.error);
