'use strict';

const fs = require('fs');

/**
 * Safely read a JSON file; returns null on any error.
 * @param {string} filePath
 * @returns {Object|null}
 */
function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Safely read a text file; returns empty string on error.
 * @param {string} filePath
 * @returns {string}
 */
function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Check if a path is accessible and matches the expected type.
 * @param {string} filePath
 * @param {'file'|'dir'} type
 * @returns {boolean}
 */
function safeAccess(filePath, type = 'file') {
  try {
    const stat = fs.statSync(filePath);
    return type === 'dir' ? stat.isDirectory() : stat.isFile();
  } catch {
    return false;
  }
}

module.exports = { safeReadJson, safeReadText, safeAccess };
