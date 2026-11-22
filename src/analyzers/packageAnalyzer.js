'use strict';

const fs = require('fs');
const path = require('path');

const RECOMMENDED_FIELDS = ['name', 'version', 'description', 'author', 'license', 'repository', 'keywords', 'homepage'];
const REQUIRED_FIELDS    = ['name', 'version'];

/**
 * Parse and analyze the project's package.json.
 * @param {string} dir
 * @returns {Promise<Object>}
 */
async function analyzePackage(dir) {
  const pkgPath = path.join(dir, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    throw new Error(`No package.json found in ${dir}`);
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (e) {
    throw new Error(`Invalid JSON in package.json: ${e.message}`);
  }

  const deps    = raw.dependencies         || {};
  const devDeps = raw.devDependencies      || {};
  const peerDeps = raw.peerDependencies    || {};
  const optDeps  = raw.optionalDependencies || {};

  const missingRequired = REQUIRED_FIELDS.filter(f => !raw[f]);
  const missingRecommended = RECOMMENDED_FIELDS.filter(f => !raw[f]);

  const hasPrivateFlag     = !!raw.private;
  const hasEngines         = !!raw.engines;
  const hasFiles           = Array.isArray(raw.files) && raw.files.length > 0;
  const hasMain            = !!raw.main;
  const hasBin             = !!raw.bin;
  const hasTypes           = !!raw.types || !!raw.typings;
  const hasWorkspaces      = !!raw.workspaces;

  const scripts = raw.scripts || {};
  const scriptNames = Object.keys(scripts);

  return {
    name:              raw.name            || '(unnamed)',
    version:           raw.version         || '0.0.0',
    description:       raw.description     || '',
    author:            raw.author          || '',
    license:           raw.license         || 'UNLICENSED',
    private:           hasPrivateFlag,
    engines:           raw.engines         || {},
    depCount:          Object.keys(deps).length,
    devDepCount:       Object.keys(devDeps).length,
    peerDepCount:      Object.keys(peerDeps).length,
    optDepCount:       Object.keys(optDeps).length,
    totalDeps:         Object.keys(deps).length + Object.keys(devDeps).length,
    deps,
    devDeps,
    peerDeps,
    optDeps,
    scripts,
    scriptNames,
    missingRequired,
    missingRecommended,
    hasPrivateFlag,
    hasEngines,
    hasFiles,
    hasMain,
    hasBin,
    hasTypes,
    hasWorkspaces,
    raw,
  };
}

/** Convenience wrapper used by the CLI info command */
async function getProjectInfo(dir) {
  const pkg = await analyzePackage(dir);
  return {
    name:         pkg.name,
    version:      pkg.version,
    description:  pkg.description || '—',
    author:       pkg.author      || '—',
    license:      pkg.license,
    dependencies: pkg.depCount,
    devDependencies: pkg.devDepCount,
    scripts:      pkg.scriptNames.length,
    'has engines': pkg.hasEngines ? 'yes' : 'no',
    private:      pkg.hasPrivateFlag ? 'yes' : 'no',
  };
}

module.exports = { analyzePackage, getProjectInfo };
