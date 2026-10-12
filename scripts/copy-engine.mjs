// Copies the Stockfish lite single-threaded engine from node_modules into
// public/engine so Vite serves it as static files. The worker script loads the
// .wasm with the same base name from its own folder, so both get one name.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve('stockfish/package.json'));
const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'engine',
);

mkdirSync(outDir, { recursive: true });
copyFileSync(
  join(packageDir, 'bin', 'stockfish-19-lite-single.js'),
  join(outDir, 'stockfish.js'),
);
copyFileSync(
  join(packageDir, 'bin', 'stockfish-19-lite-single.wasm'),
  join(outDir, 'stockfish.wasm'),
);
// Stockfish is GPL-3.0: ship its license next to the binary.
copyFileSync(join(packageDir, 'Copying.txt'), join(outDir, 'COPYING.txt'));

console.log(
  'copy-engine: Stockfish lite single-threaded engine -> public/engine/',
);
