# Icon Generation Guide

## Prerequisites

Install sharp for image generation:

```powershell
npm install sharp
```

## Generate Icons

Run the icon generation script:

```powershell
node scripts/generate-icons.mjs
```

## Generated Files

The script will create the following files in `frontend/public/`:

- `favicon-16x16.png` - Small browser tab icon
- `favicon-32x32.png` - Standard browser tab icon
- `favicon-48x48.png` - Large browser tab icon
- `android-chrome-192x192.png` - Android PWA icon
- `android-chrome-512x512.png` - Android PWA splash icon
- `apple-touch-icon.png` - iOS home screen icon (180x180)
- `mstile-150x150.png` - Windows tile icon

## Next.js Dynamic Icons

Next.js 14 will also generate icons from:

- `src/app/icon.tsx` - Standard favicon
- `src/app/apple-icon.tsx` - Apple touch icon
- `src/app/opengraph-image.tsx` - Open Graph social media image

These are dynamically generated at build time using the `next/og` ImageResponse API.

## Manual Alternative

If you prefer to create icons manually:

1. Use a tool like Figma or Sketch to export the FinShapeLogo SVG
2. Use an online favicon generator like [RealFaviconGenerator](https://realfavicongenerator.net/)
3. Place the generated files in `frontend/public/`

## Logo Design

The Advancia Pay Ledger logo features:

- **Hexagonal shape** representing stability and trust
- **Financial chart line** showing growth and market dynamics
- **Currency symbol** indicating payment and transaction capabilities
- **Gradient colors** (blue → cyan → teal) representing modern fintech innovation
