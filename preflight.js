/**
 * Preflight syntax check — catches template-literal mismatches,
 * stray parens, and other parse errors before the browser does.
 *
 * Usage:  node preflight.js        (or:  npm run preflight)
 * Exits 0 if all files parse, 1 on first failure.
 */
import { readFileSync } from 'fs';
import { Script } from 'vm';

const FILES = [
  'core.js',
  'storage.js',
  'render.js',
  'stations.js',
  'app.js',
  'supabase.js',
  'sw.js',
];

let failed = false;

for (const f of FILES) {
  try {
    new Script(readFileSync(f, 'utf8'), { filename: f });
    console.log(`  ✓  ${f}`);
  } catch (e) {
    console.error(`  ✗  ${f}  →  ${e.message}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
