#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync("rg --files -g '*.rs' -g '*.js' -g '*.mjs'", {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean)
  .filter((f) => !f.startsWith('backup/'));

const map = new Map();

const patterns = [
  /\bfn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  /\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  /\bconst\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\([^)]*\)\s*=>/g,
];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      const name = m[1];
      if (name.startsWith('test_')) continue;
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(file);
    }
  }
}

const duplicates = [...map.entries()]
  .map(([name, locations]) => [name, [...new Set(locations)]])
  .filter(([, locations]) => locations.length > 1)
  .sort((a, b) => a[0].localeCompare(b[0]));

if (duplicates.length > 0) {
  console.error('Duplicate function names detected (choose a single best function):');
  for (const [name, locations] of duplicates) {
    console.error(`- ${name}: ${locations.join(', ')}`);
  }
  process.exit(1);
}

console.log(`No duplicate function names across ${files.length} source files.`);
