'use strict';

const fs   = require('fs');
const path = require('path');
const glob = require('glob');

// Packages that are always "used" even without explicit require/import
const ALWAYS_USED = new Set([
  'typescript', 'ts-node', 'ts-node-dev', '@types', 'prettier',
  'eslint', 'jest', 'mocha', 'chai', 'sinon', 'nyc', 'c8',
  'husky', 'lint-staged', 'commitizen', 'semantic-release',
  'webpack', 'rollup', 'esbuild', 'parcel', 'vite', 'turbo',
  'babel-jest', '@babel', 'nodemon', 'concurrently',
]);

const IMPORT_RE  = /(?:require\s*\(\s*['"`]|from\s+['"`]|import\s+['"`])([^'"`\s/]+)/g;
const DYNAMIC_RE = /import\s*\(\s*['"`]([^'"`\s/]+)['"`]\s*\)/g;

function collectImports(content) {
  const names = new Set();
  for (const re of [IMPORT_RE, DYNAMIC_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      // Normalise scoped packages: @scope/pkg -> @scope/pkg
      const raw = m[1];
      const name = raw.startsWith('@')
        ? raw.split('/').slice(0, 2).join('/')
        : raw.split('/')[0];
      names.add(name);
    }
  }
  return names;
}

/**
 * Detect dependencies that are declared but never imported in source files.
 * @param {string} dir
 * @param {Object} pkg  Result of analyzePackage()
 * @returns {Promise<Object>}
 */
async function detectUnusedDependencies(dir, pkg) {
  const srcGlobs = [
    '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.mjs', '**/*.cjs',
    '**/*.json',
  ];

  const ignorePatterns = [
    'node_modules/**', 'dist/**', 'build/**', 'coverage/**', '.git/**',
  ];

  let files = [];
  for (const pattern of srcGlobs) {
    try {
      const found = glob.sync(pattern, { cwd: dir, ignore: ignorePatterns, absolute: true });
      files.push(...found);
    } catch {
      // ignore glob errors
    }
  }

  const usedImports = new Set();
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      for (const name of collectImports(content)) {
        usedImports.add(name);
      }
    } catch {
      // skip unreadable files
    }
  }

  const unused = [];
  const likely_used = [];

  for (const name of Object.keys(pkg.deps)) {
    // Skip always-used packages / type definitions
    if ([...ALWAYS_USED].some(p => name.startsWith(p))) {
      likely_used.push(name);
      continue;
    }
    if (!usedImports.has(name)) {
      unused.push(name);
    }
  }

  return {
    unused,
    likely_used,
    usedImports: [...usedImports],
    scannedFiles: files.length,
    skipped: false,
  };
}

module.exports = { detectUnusedDependencies };
