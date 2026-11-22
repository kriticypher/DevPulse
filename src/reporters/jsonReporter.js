'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Export the full audit report as a JSON file.
 * @param {Object} report
 * @param {string} outPath
 * @returns {Promise<void>}
 */
async function exportJsonReport(report, outPath) {
  const output = {
    tool:      'kriti-devpulse',
    version:   require('../../package.json').version,
    timestamp: report.timestamp,
    target:    report.targetDir,
    score: {
      value:     report.scoreData.score,
      grade:     report.scoreData.grade,
      label:     report.scoreData.label,
      breakdown: report.scoreData.breakdown,
    },
    summary: {
      totalFiles:          report.structure.totalFiles,
      totalDirs:           report.structure.totalDirs,
      extensions:          report.structure.extensions,
      dependencies:        report.pkg.depCount,
      devDependencies:     report.pkg.devDepCount,
      scripts:             report.pkg.scriptNames.length,
    },
    findings: {
      missingFiles:        report.missingFiles.missing,
      dependencyIssues:    report.depHealth.issues,
      dependencyWarnings:  report.depHealth.warnings,
      deprecatedPackages:  report.depHealth.deprecated,
      unusedDependencies:  report.unusedDeps.unused || [],
      scriptIssues:        report.scriptIssues.missing,
      largeFiles:          report.sizeReport.largeFiles || [],
    },
    metadata: {
      name:    report.pkg.name,
      version: report.pkg.version,
      license: report.pkg.license,
      author:  report.pkg.author,
      engines: report.pkg.engines,
    },
  };

  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
}

module.exports = { exportJsonReport };
