'use strict';

const RECOMMENDED_SCRIPTS = [
  { name: 'start',   severity: 'warning',  reason: '"start" script is the standard entry point for npm projects.' },
  { name: 'test',    severity: 'warning',  reason: '"test" script is expected by most CI pipelines.' },
  { name: 'build',   severity: 'info',     reason: '"build" script is expected for compiled or bundled projects.' },
  { name: 'lint',    severity: 'info',     reason: '"lint" script enables automated code quality checks.' },
  { name: 'prepare', severity: 'info',     reason: '"prepare" runs before packing/publishing.' },
];

const DANGEROUS_PATTERNS = [
  { pattern: /rm\s+-rf\s+\//, label: 'rm -rf /', severity: 'critical' },
  { pattern: /curl\s+.*\|\s*(sh|bash)/, label: 'curl | shell',  severity: 'critical' },
  { pattern: /wget\s+.*\|\s*(sh|bash)/, label: 'wget | shell',  severity: 'critical' },
  { pattern: /eval\s*\(/, label: 'eval()',     severity: 'warning' },
  { pattern: /process\.exit\s*\(\s*[^0]/, label: 'process.exit non-zero', severity: 'info' },
];

const PLACEHOLDER_RE = /^(echo\s+"?TODO|placeholder|fixme)/i;

/**
 * Validate npm scripts for best-practice compliance and dangerous patterns.
 * @param {Object} pkg  Result of analyzePackage()
 * @returns {Promise<Object>}
 */
async function validateNpmScripts(pkg) {
  const { scripts = {} } = pkg;

  const missing  = [];
  const dangers  = [];
  const placeholders = [];
  const info     = [];

  // Check recommended scripts
  for (const def of RECOMMENDED_SCRIPTS) {
    if (!scripts[def.name]) {
      missing.push(def);
    }
  }

  // Inspect script bodies
  for (const [name, body] of Object.entries(scripts)) {
    // Dangerous patterns
    for (const { pattern, label, severity } of DANGEROUS_PATTERNS) {
      if (pattern.test(body)) {
        dangers.push({ script: name, body, label, severity });
      }
    }

    // Placeholder / empty scripts
    if (!body.trim() || PLACEHOLDER_RE.test(body.trim())) {
      placeholders.push({ script: name, body });
    }

    // Very long script bodies (maintainability concern)
    if (body.length > 200) {
      info.push({ script: name, reason: `Script body is very long (${body.length} chars). Consider moving to a shell file.` });
    }

    // Missing interpreter on scripts that call node directly
    if (/^node\s/.test(body.trim())) {
      info.push({ script: name, reason: `Script calls "node" directly — ensure node is on PATH in CI.` });
    }
  }

  return {
    scriptCount: Object.keys(scripts).length,
    missing,
    dangers,
    placeholders,
    info,
    issueCount: missing.filter(m => m.severity !== 'info').length + dangers.length,
  };
}

module.exports = { validateNpmScripts };
