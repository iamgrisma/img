import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

if (!fs.existsSync(path.join('src', 'fonts', 'embedded-fonts.ts'))) {
  console.log('Generating embedded fonts module...');
  execSync('node scripts/build-fonts.js', { stdio: 'inherit' });
}

console.log('Generating static production assets...');
execSync('node scripts/generate-assets.js', { stdio: 'inherit' });

console.log('Compiling Pages Functions into public/_worker.js...');
execSync('npx tsc --noEmit', { stdio: 'inherit' });
execSync('npx wrangler pages functions build src/functions --outdir public', { stdio: 'inherit' });

const indexJs = path.join('public', 'index.js');
const workerJs = path.join('public', '_worker.js');
if (fs.existsSync(indexJs)) {
  fs.renameSync(indexJs, workerJs);
  console.log('Successfully generated public/_worker.js');
}
