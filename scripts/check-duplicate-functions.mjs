#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const TARGET_EXTENSIONS = new Set(['.rs', '.js', '.mjs']);
const IGNORED_PREFIXES = ['backup/'];
const IGNORED_SEGMENTS = new Set(['.git', 'node_modules', 'target', 'dist', 'build']);

function normalize(file) {
  return file.replaceAll('\\', '/');
}

function isTrackedSource(file) {
  const normalized = normalize(file);
  if (IGNORED_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return false;
  }
  return TARGET_EXTENSIONS.has(path.extname(normalized));
}

function listViaGit() {
  const output = execSync('git ls-files', { encoding: 'utf8' });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(isTrackedSource);
}

function listViaRipgrep() {
  const output = execSync("rg --files -g '*.rs' -g '*.js' -g '*.mjs'", {
    encoding: 'utf8',
  });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(isTrackedSource);
}

function listViaFs(rootDir = '.') {
  const collected = [];

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      const rel = normalize(path.relative(rootDir, fullPath));

      if (entry.isDirectory()) {
        if (IGNORED_SEGMENTS.has(entry.name)) continue;
        if (IGNORED_PREFIXES.some((prefix) => rel.startsWith(prefix))) continue;
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!statSync(fullPath).isFile()) continue;

      if (isTrackedSource(rel)) {
        collected.push(rel);
      }
    }
  }

  walk(rootDir);
  return collected;
}

function listSourceFiles() {
  try {
    return listViaGit();
  } catch {
    try {
      return listViaRipgrep();
    } catch {
      return listViaFs();
    }
  }
}

const files = listSourceFiles();
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
    let match;
    while ((match = re.exec(src)) !== null) {
      const name = match[1];
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
