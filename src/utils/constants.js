'use strict';

/** Directories always excluded from analysis */
const IGNORE_DIRS = Object.freeze([
  'node_modules', '.git', '.svn', 'dist', 'build',
  'coverage', '.nyc_output', '.cache', 'tmp', 'temp',
]);

/** File glob patterns for source code scanning */
const SOURCE_PATTERNS = Object.freeze([
  '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.mjs', '**/*.cjs',
]);

/** Glob ignore patterns */
const GLOB_IGNORE = Object.freeze([
  'node_modules/**', 'dist/**', 'build/**', 'coverage/**', '.git/**',
]);

/** Severity levels */
const SEVERITY = Object.freeze({
  CRITICAL: 'critical',
  WARNING:  'warning',
  INFO:     'info',
  OK:       'ok',
});

/** Grade thresholds */
const GRADE_THRESHOLDS = Object.freeze({ A: 90, B: 80, C: 70, D: 60 });

/** Default large-file thresholds (bytes) */
const FILE_SIZE = Object.freeze({
  LARGE: 500 * 1024,
  WARN:  100 * 1024,
});

module.exports = { IGNORE_DIRS, SOURCE_PATTERNS, GLOB_IGNORE, SEVERITY, GRADE_THRESHOLDS, FILE_SIZE };
