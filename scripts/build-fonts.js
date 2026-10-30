import fs from 'fs';
import path from 'path';

const fontsDir = path.join('src', 'fonts');
const pjsPath = path.join(fontsDir, 'plus-jakarta-sans.ttf');
const interPath = path.join(fontsDir, 'inter.ttf');
const kalimatiPath = path.join(fontsDir, 'kalimati.ttf');

if (!fs.existsSync(pjsPath) || !fs.existsSync(kalimatiPath) || !fs.existsSync(interPath)) {
  console.error('Source fonts not found in src/fonts!');
  process.exit(1);
}

const pjsBuf = fs.readFileSync(pjsPath);
const interBuf = fs.readFileSync(interPath);
const kalimatiBuf = fs.readFileSync(kalimatiPath);

console.log(`Plus Jakarta Sans: ${pjsBuf.length} bytes`);
console.log(`Inter: ${interBuf.length} bytes`);
console.log(`Kalimati: ${kalimatiBuf.length} bytes`);

const code = `// Pre-bundled core typography fonts for Resvg WebAssembly rendering
// Includes:
// 1. Plus Jakarta Sans (Latin / English typography)
// 2. Inter (Extended Latin typography & UI symbols)
// 3. Kalimati (Official Devanagari / Nepali typography)

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const PJS_B64 = '${pjsBuf.toString('base64')}';
const INTER_B64 = '${interBuf.toString('base64')}';
const KALIMATI_B64 = '${kalimatiBuf.toString('base64')}';

let cachedFontBuffers: Uint8Array[] | null = null;

export function getCoreFontBuffers(): Uint8Array[] {
  if (!cachedFontBuffers) {
    cachedFontBuffers = [
      base64ToUint8Array(PJS_B64),
      base64ToUint8Array(INTER_B64),
      base64ToUint8Array(KALIMATI_B64),
    ];
  }
  return cachedFontBuffers;
}
`;

fs.writeFileSync(path.join(fontsDir, 'embedded-fonts.ts'), code);
console.log('Successfully generated src/fonts/embedded-fonts.ts');
