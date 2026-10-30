import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Compiling Pages Functions into public/_worker.js...');
execSync('npx wrangler pages functions build --outdir public', { stdio: 'inherit' });

const indexJs = path.join('public', 'index.js');
const workerJs = path.join('public', '_worker.js');
if (fs.existsSync(indexJs)) {
  fs.renameSync(indexJs, workerJs);
  console.log('Successfully generated public/_worker.js');
}

