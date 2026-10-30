import fs from 'fs';
import path from 'path';
import { Resvg } from '@cf-wasm/resvg';
import { PhotonImage } from '@cf-wasm/photon';

async function generateAssets() {
  console.log('Generating production assets...');

  const logoSvgPath = path.join('public', 'logo.svg');
  if (!fs.existsSync(logoSvgPath)) {
    throw new Error('public/logo.svg not found!');
  }
  const logoSvg = fs.readFileSync(logoSvgPath, 'utf-8');
  const logoBase64 = Buffer.from(logoSvg).toString('base64');

  // 1. Generate multi-resolution favicon.ico (16, 32, 48)
  console.log('Generating public/favicon.ico...');
  const iconSizes = [16, 32, 48];
  const iconPngs = [];
  for (const size of iconSizes) {
    const resvg = await Resvg.async(logoSvg, {
      fitTo: { mode: 'width', value: size },
      background: 'rgba(0,0,0,0)',
    });
    iconPngs.push({ size, data: Buffer.from(resvg.render().asPng()) });
  }

  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type 1 = ICO
  icoHeader.writeUInt16LE(iconPngs.length, 4); // count

  let offset = 6 + (16 * iconPngs.length);
  const dirEntries = [];
  for (const item of iconPngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 0);
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(item.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += item.data.length;
  }

  const icoBuffer = Buffer.concat([icoHeader, ...dirEntries, ...iconPngs.map(p => p.data)]);
  fs.writeFileSync(path.join('public', 'favicon.ico'), icoBuffer);
  console.log(`Generated public/favicon.ico (${icoBuffer.length} bytes)`);

  // 2. Generate 1200x630 og.svg
  console.log('Generating public/og.svg (1200x630)...');
  const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080c16"/>
      <stop offset="50%" stop-color="#0b1120"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <radialGradient id="cyanGlow" cx="15%" cy="20%" r="55%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="greenGlow" cx="85%" cy="80%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.75" stroke-opacity="0.6"/>
    </pattern>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111827" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#0b0f19" stop-opacity="0.95"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#cyanGlow)"/>
  <rect width="1200" height="630" fill="url(#greenGlow)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Border Frame -->
  <rect x="24" y="24" width="1152" height="582" rx="20" fill="none" stroke="#1f2937" stroke-width="1.5"/>

  <!-- Inner Branding Container -->
  <g transform="translate(80, 80)">
    <!-- Logo Badge Box -->
    <rect x="0" y="0" width="110" height="110" rx="24" fill="url(#cardGrad)" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="2"/>
    <image href="data:image/svg+xml;base64,${logoBase64}" x="15" y="15" width="80" height="80"/>

    <!-- Category Pill -->
    <rect x="135" y="10" width="160" height="32" rx="16" fill="#0369a1" fill-opacity="0.25" stroke="#38bdf8" stroke-opacity="0.4" stroke-width="1"/>
    <text x="215" y="31" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" letter-spacing="1" text-anchor="middle">EDGE OPTIMIZER</text>

    <!-- Main Title -->
    <text x="135" y="85" fill="url(#textGrad)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="800" letter-spacing="-1">ImagEngine</text>

    <!-- Subtitle & Value Proposition -->
    <text x="0" y="165" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700">Real-Time Image Transformation &amp; Optimization Engine</text>
    <text x="0" y="205" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="500">Native WebAssembly Raster &amp; Vector Processing on Cloudflare Pages Advanced Edge</text>

    <!-- Capability Badges -->
    <g transform="translate(0, 245)">
      <!-- Badge 1: Cloudflare Pages -->
      <rect x="0" y="0" width="170" height="40" rx="20" fill="#1e293b" fill-opacity="0.7" stroke="#334155" stroke-width="1"/>
      <circle cx="22" cy="20" r="5" fill="#38bdf8"/>
      <text x="96" y="25" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" text-anchor="middle">Cloudflare Pages</text>

      <!-- Badge 2: Photon Wasm -->
      <rect x="185" y="0" width="155" height="40" rx="20" fill="#1e293b" fill-opacity="0.7" stroke="#334155" stroke-width="1"/>
      <circle cx="207" cy="20" r="5" fill="#34d399"/>
      <text x="270" y="25" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" text-anchor="middle">Photon WASM</text>

      <!-- Badge 3: resvg Wasm -->
      <rect x="355" y="0" width="150" height="40" rx="20" fill="#1e293b" fill-opacity="0.7" stroke="#334155" stroke-width="1"/>
      <circle cx="377" cy="20" r="5" fill="#a78bfa"/>
      <text x="438" y="25" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" text-anchor="middle">resvg WASM</text>

      <!-- Badge 4: Edge Cache -->
      <rect x="520" y="0" width="175" height="40" rx="20" fill="#1e293b" fill-opacity="0.7" stroke="#334155" stroke-width="1"/>
      <circle cx="542" cy="20" r="5" fill="#f59e0b"/>
      <text x="615" y="25" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" text-anchor="middle">Immutable Caching</text>

      <!-- Badge 5: Crash-Proof -->
      <rect x="710" y="0" width="165" height="40" rx="20" fill="#1e293b" fill-opacity="0.7" stroke="#334155" stroke-width="1"/>
      <circle cx="732" cy="20" r="5" fill="#f43f5e"/>
      <text x="800" y="25" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" text-anchor="middle">4x Upscale Guard</text>
    </g>

    <!-- Code / Request Sample Bar -->
    <g transform="translate(0, 325)">
      <rect x="0" y="0" width="1040" height="90" rx="14" fill="#030712" fill-opacity="0.9" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Window Dots -->
      <circle cx="28" cy="26" r="5" fill="#ef4444" fill-opacity="0.8"/>
      <circle cx="44" cy="26" r="5" fill="#f59e0b" fill-opacity="0.8"/>
      <circle cx="60" cy="26" r="5" fill="#10b981" fill-opacity="0.8"/>
      <text x="85" y="30" fill="#64748b" font-family="monospace" font-size="12">EDGE REQUEST PIPELINE</text>

      <text x="28" y="65" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="600">GET</text>
      <text x="70" y="65" fill="#f1f5f9" font-family="'JetBrains Mono', monospace" font-size="15">/objects.tn/banner.jpg?format=webp&amp;w=1200&amp;fit=cover</text>
      <text x="720" y="65" fill="#34d399" font-family="'JetBrains Mono', monospace" font-size="13">200 OK (Cache-Control: 1-Year)</text>
    </g>
  </g>
</svg>
`.trim();

  fs.writeFileSync(path.join('public', 'og.svg'), ogSvg);
  console.log('Saved public/og.svg');

  // 3. Render public/og.svg to public/og.webp using resvg and photon
  console.log('Rendering public/og.webp (1200x630 WebP) with embedded core fonts...');
  const fontsDir = path.join('src', 'fonts');
  const pjsBuf = fs.readFileSync(path.join(fontsDir, 'plus-jakarta-sans.ttf'));
  const interBuf = fs.readFileSync(path.join(fontsDir, 'inter.ttf'));
  const kalimatiBuf = fs.readFileSync(path.join(fontsDir, 'kalimati.ttf'));

  const resvgOg = await Resvg.async(ogSvg, {
    fitTo: { mode: 'width', value: 1200 },
    background: '#080c16',
    font: {
      loadSystemFonts: false,
      fontBuffers: [pjsBuf, interBuf, kalimatiBuf],
      defaultFontFamily: 'Plus Jakarta Sans',
      sansSerifFamily: 'Plus Jakarta Sans',
      serifFamily: 'Kalimati',
    },
  });
  const ogPng = Buffer.from(resvgOg.render().asPng());
  const photonImg = PhotonImage.new_from_byteslice(ogPng);
  const ogWebp = Buffer.from(photonImg.get_bytes_webp());
  photonImg.free();

  fs.writeFileSync(path.join('public', 'og.webp'), ogWebp);
  console.log(`Generated public/og.webp (${ogWebp.length} bytes)`);

  console.log('All production assets successfully created!');
}

generateAssets().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});

