'use strict';

const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.svn', 'dist', 'build',
  'coverage', '.nyc_output', '.cache', 'tmp', 'temp',
]);

/**
 * Recursively scan a directory and return a structure summary.
 * @param {string} dir  Root directory to scan
 * @param {number} depth  How deep to recurse (default 4)
 * @returns {Promise<Object>}
 */
async function scanDirectory(dir, depth = 4) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Directory not found: ${dir}`);
  }

  const stats = {
    totalFiles: 0,
    totalDirs: 0,
    extensions: {},
    rootFiles: [],
    rootDirs: [],
    hasPackageJson: false,
    hasSrcDir: false,
    hasTestDir: false,
    hasNodeModules: false,
  };

  function walk(current, currentDepth) {
    if (currentDepth > depth) return;

    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) {
        if (entry.name === 'node_modules' && currentDepth === 0) {
          stats.hasNodeModules = true;
        }
        continue;
      }

      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        stats.totalDirs++;
        if (currentDepth === 0) {
          stats.rootDirs.push(entry.name);
          if (entry.name === 'src') stats.hasSrcDir = true;
          if (['test', 'tests', '__tests__', 'spec'].includes(entry.name)) {
            stats.hasTestDir = true;
          }
        }
        walk(fullPath, currentDepth + 1);
      } else if (entry.isFile()) {
        stats.totalFiles++;
        if (currentDepth === 0) {
          stats.rootFiles.push(entry.name);
          if (entry.name === 'package.json') stats.hasPackageJson = true;
        }
        const ext = path.extname(entry.name).toLowerCase() || '(no ext)';
        stats.extensions[ext] = (stats.extensions[ext] || 0) + 1;
      }
    }
  }

  walk(dir, 0);
  return stats;
}

module.exports = { scanDirectory };
