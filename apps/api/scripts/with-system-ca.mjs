import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

const env = {
  ...process.env,
  NODE_OPTIONS: [process.env.NODE_OPTIONS, '--use-system-ca']
    .filter(Boolean)
    .join(' ')
    .trim(),
};

const nestBin = path.join(apiRoot, 'node_modules', '@nestjs/cli', 'bin', 'nest.js');
const result = spawnSync(process.execPath, [nestBin, ...args], {
  stdio: 'inherit',
  env,
  cwd: apiRoot,
});

process.exit(result.status ?? 1);
