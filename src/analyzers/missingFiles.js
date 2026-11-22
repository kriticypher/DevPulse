'use strict';

const fs = require('fs');
const path = require('path');

/** Files that a healthy project MUST have */
const REQUIRED_FILES = [
  { file: 'package.json',    severity: 'critical', reason: 'npm manifest is required' },
  { file: 'README.md',       severity: 'warning',  reason: 'documentation is strongly recommended' },
];

/** Files that a healthy project SHOULD have */
const RECOMMENDED_FILES = [
  { file: '.gitignore',      severity: 'warning',  reason: 'prevents committing generated files' },
  { file: '.npmignore',      severity: 'info',     reason: 'controls what lands in the npm tarball' },
  { file: 'LICENSE',         severity: 'warning',  reason: 'missing license may deter adoption' },
  { file: 'CHANGELOG.md',    severity: 'info',     reason: 'helps users track changes between versions' },
  { file: 'CONTRIBUTING.md', severity: 'info',     reason: 'guides external contributors' },
  { file: '.editorconfig',   severity: 'info',     reason: 'enforces consistent code style in editors' },
];

/** CI/tooling config files */
const TOOLING_FILES = [
  { file: '.eslintrc.js',    alt: ['.eslintrc', '.eslintrc.json', '.eslintrc.cjs'],
    severity: 'info',        reason: 'ESLint config missing — linting may be unconfigured' },
  { file: '.prettierrc',     alt: ['.prettierrc.js', '.prettierrc.json', 'prettier.config.js'],
    severity: 'info',        reason: 'Prettier config missing' },
  { file: 'jest.config.js',  alt: ['jest.config.ts', 'jest.config.cjs'],
    severity: 'info',        reason: 'Jest config file absent (may be in package.json)' },
];

function exists(dir, file) {
  return fs.existsSync(path.join(dir, file));
}

function existsAny(dir, files) {
  return files.some(f => exists(dir, f));
}

/**
 * Check which expected files are missing.
 * @param {string} dir
 * @returns {Promise<Object>}
 */
async function checkMissingFiles(dir) {
  const missing   = [];
  const present   = [];

  for (const def of REQUIRED_FILES) {
    if (exists(dir, def.file)) {
      present.push({ ...def, category: 'required' });
    } else {
      missing.push({ ...def, category: 'required' });
    }
  }

  for (const def of RECOMMENDED_FILES) {
    if (exists(dir, def.file)) {
      present.push({ ...def, category: 'recommended' });
    } else {
      missing.push({ ...def, category: 'recommended' });
    }
  }

  for (const def of TOOLING_FILES) {
    const found = exists(dir, def.file) || (def.alt && existsAny(dir, def.alt));
    if (found) {
      present.push({ file: def.file, severity: def.severity, reason: def.reason, category: 'tooling' });
    } else {
      missing.push({ file: def.file, severity: def.severity, reason: def.reason, category: 'tooling' });
    }
  }

  const criticalCount = missing.filter(m => m.severity === 'critical').length;
  const warningCount  = missing.filter(m => m.severity === 'warning').length;

  return { missing, present, criticalCount, warningCount };
}

module.exports = { checkMissingFiles };
