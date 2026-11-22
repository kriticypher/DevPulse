'use strict';

const fs   = require('fs');
const path = require('path');
const glob = require('glob');

const LARGE_FILE_THRESHOLD  = 500 * 1024;    //  500 KB
const WARN_FILE_THRESHOLD   = 100 * 1024;    //  100 KB

const IGNORE_DIRS = [
  'node_modules/**', 'dist/**', 'build/**',
  'coverage/**', '.git/**', '*.lock', 'package-lock.json',
];

/**
 * @param {number} bytes
 * @returns {string}
 */
function humanSize(bytes) {
  if (bytes < 1024)             return `${bytes} B`;
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Identify unusually large source files.
 * @param {string} dir
 * @returns {Promise<Object>}
 */
async function analyzeFileSizes(dir) {
  const patterns = ['**/*.js', '**/*.ts', '**/*.json', '**/*.css', '**/*.html'];

  let files = [];
  for (const pattern of patterns) {
    try {
      const found = glob.sync(pattern, { cwd: dir, ignore: IGNORE_DIRS, absolute: true });
      files.push(...found);
    } catch {
      // skip
    }
  }

  // Deduplicate
  files = [...new Set(files)];

  const largeFFiles = [];
  const warnFiles   = [];
  let totalSize     = 0;
  let largestFile   = null;
  let largestSize   = 0;

  for (const file of files) {
    let size;
    try {
      size = fs.statSync(file).size;
    } catch {
      continue;
    }
    totalSize += size;

    if (size > largestSize) {
      largestSize = size;
      largestFile = file;
    }

    if (size > LARGE_FILE_THRESHOLD) {
      largeFFiles.push({ file: path.relative(dir, file), size, human: humanSize(size), severity: 'warning' });
    } else if (size > WARN_FILE_THRESHOLD) {
      warnFiles.push({ file: path.relative(dir, file), size, human: humanSize(size), severity: 'info' });
    }
  }

  // Sort by size descending
  largeFFiles.sort((a, b) => b.size - a.size);
  warnFiles.sort((a, b) => b.size - a.size);

  return {
    scannedFiles: files.length,
    totalSize,
    totalSizeHuman: humanSize(totalSize),
    largeFiles: largeFFiles,
    warnFiles,
    largestFile: largestFile ? path.relative(dir, largestFile) : null,
    largestSize,
    largestSizeHuman: humanSize(largestSize),
    skipped: false,
  };
}

module.exports = { analyzeFileSizes, humanSize };
