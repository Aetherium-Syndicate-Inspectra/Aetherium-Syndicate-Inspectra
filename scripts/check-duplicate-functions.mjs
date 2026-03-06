#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const TARGET_EXTENSIONS = new Set(['.py', '.rs', '.js', '.mjs', '.ts', '.tsx']);
const IGNORED_PREFIXES = ['backup/', 'tests/'];
const IGNORED_SEGMENTS = new Set(['.git', 'node_modules', 'target', 'dist', 'build', '.venv', '__pycache__']);

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
  const output = execSync("rg --files -g '*.py' -g '*.rs' -g '*.js' -g '*.mjs' -g '*.ts' -g '*.tsx'", {
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
const occurrencesByName = new Map();

const patterns = [
  /\bdef\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  /\bfn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  /\basync\s+function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  /\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  /\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
  /\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?[A-Za-z_][A-Za-z0-9_]*\s*=>/g,
  /^\s*async\s+def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm,
  /^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm,
];

function lineNumberFromIndex(source, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

for (const file of files) {
  const src = readFileSync(file, 'utf8');

  for (const re of patterns) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(src)) !== null) {
      const name = match[1];
      if (name.startsWith('test_') || name.startsWith('__')) continue;
      const location = `${file}:${lineNumberFromIndex(src, match.index)}`;
      if (!occurrencesByName.has(name)) occurrencesByName.set(name, []);
      occurrencesByName.get(name).push(location);
    }
  }
}

const duplicates = [...occurrencesByName.entries()]
  .map(([name, locations]) => [name, [...new Set(locations)]])
  .filter(([, locations]) => {
    const uniqueFiles = new Set(locations.map((entry) => entry.split(':')[0]));
    return uniqueFiles.size > 1;
  })
  .sort((a, b) => a[0].localeCompare(b[0]));

if (duplicates.length > 0) {
  console.error('Duplicate function names detected across files (choose a single best function):');
  for (const [name, locations] of duplicates) {
    console.error(`- ${name}: ${locations.join(', ')}`);
  }
  process.exit(1);
}

console.log(`No duplicate function names across ${files.length} source files.`);
