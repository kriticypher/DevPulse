'use strict';

const semver = require('semver');

const DANGEROUS_RANGES = ['*', 'latest', 'next', 'x', '>=0.0.0'];
const PINNED_RE = /^\d+\.\d+\.\d+$/;      // exact version e.g. 1.2.3
const LOOSE_RE  = /^[~^]/;                    // ~1.2.3 or ^1.2.3

/** Well-known deprecated / high-risk packages */
const KNOWN_DEPRECATED = {
  request:          'Deprecated; use node-fetch, axios, or got instead.',
  'node-uuid':      'Renamed to "uuid".',
  'jade':           'Renamed to "pug".',
  'nomnom':         'Unmaintained; use commander or yargs.',
  'colors':         'Maintainer went rogue in v1.4.44+; use chalk instead.',
  'faker':          'Version 6+ maintainer went rogue; use @faker-js/faker.',
  'event-stream':   'Was backdoored; remove immediately.',
  'flatmap-stream': 'Was backdoored; remove immediately.',
};

function classifyRange(spec) {
  if (!spec || spec === '') return 'missing';
  if (DANGEROUS_RANGES.includes(spec)) return 'dangerous';
  if (PINNED_RE.test(spec)) return 'pinned';
  if (LOOSE_RE.test(spec)) return 'loose';
  if (spec.startsWith('>=') || spec.startsWith('>')) return 'dangerous';
  if (spec.startsWith('<=') || spec.startsWith('<')) return 'bounded';
  return 'unknown';
}

/**
 * Analyse dependency version specifiers and flag problems.
 * @param {Object} pkg  Result of analyzePackage()
 * @returns {Promise<Object>}
 */
async function checkDependencyHealth(pkg) {
  const issues       = [];
  const warnings     = [];
  const info         = [];
  const deprecated   = [];
  const depDetails   = [];

  const allDeps = {
    ...pkg.deps,
    ...pkg.devDeps,
    ...pkg.peerDeps,
    ...pkg.optDeps,
  };

  for (const [name, spec] of Object.entries(pkg.deps)) {
    const kind = classifyRange(spec);
    depDetails.push({ name, spec, kind, type: 'dep' });

    if (kind === 'dangerous') {
      issues.push({ name, spec, reason: `Dangerous version specifier "${spec}" allows any version.` });
    } else if (kind === 'missing') {
      issues.push({ name, spec, reason: 'Version specifier is missing or empty.' });
    }

    if (KNOWN_DEPRECATED[name]) {
      deprecated.push({ name, spec, advice: KNOWN_DEPRECATED[name] });
    }
  }

  for (const [name, spec] of Object.entries(pkg.devDeps)) {
    const kind = classifyRange(spec);
    depDetails.push({ name, spec, kind, type: 'devDep' });

    if (kind === 'dangerous') {
      warnings.push({ name, spec, reason: `DevDep "${name}" has dangerous specifier "${spec}".` });
    }
    if (KNOWN_DEPRECATED[name]) {
      deprecated.push({ name, spec, advice: KNOWN_DEPRECATED[name] });
    }
  }

  // Flag duplicate names across dep groups
  const depNames    = new Set(Object.keys(pkg.deps));
  const devDepNames = new Set(Object.keys(pkg.devDeps));
  const duplicates  = [...depNames].filter(n => devDepNames.has(n));
  for (const dup of duplicates) {
    warnings.push({ name: dup, reason: `"${dup}" appears in both dependencies and devDependencies.` });
  }

  // Flag very heavy dependency lists
  if (pkg.depCount > 30) {
    info.push('Production dependency count is high (>30). Consider auditing for unused packages.');
  }
  if (pkg.depCount + pkg.devDepCount > 60) {
    info.push('Total dependencies exceed 60. Bundle size or install time may be impacted.');
  }

  return {
    issues,
    warnings,
    info,
    deprecated,
    depDetails,
    issueCount:    issues.length,
    warningCount:  warnings.length,
    deprecatedCount: deprecated.length,
    duplicates,
  };
}

module.exports = { checkDependencyHealth };
