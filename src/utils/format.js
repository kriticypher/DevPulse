'use strict';

/**
 * Format bytes to a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
function humanSize(bytes) {
  if (bytes < 1024)             return `${bytes} B`;
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Pad a string on the right to a given length.
 * @param {string} str
 * @param {number} len
 * @returns {string}
 */
function padEnd(str, len) {
  return String(str).padEnd(len);
}

/**
 * Clamp a value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map a score to a letter grade.
 * @param {number} score
 * @returns {string}
 */
function gradeFromScore(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

module.exports = { humanSize, padEnd, clamp, gradeFromScore };
