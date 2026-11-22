'use strict';

/**
 * DevPulse Health Score
 *
 * Scoring domains (total = 100):
 *   Package metadata        20 pts
 *   Missing files           20 pts
 *   Dependency health       25 pts
 *   npm scripts             15 pts
 *   File hygiene            10 pts
 *   Bonus (extras)          10 pts
 */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function gradeFromScore(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function labelFromGrade(grade) {
  const map = { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Poor', F: 'Critical' };
  return map[grade] || 'Unknown';
}

/**
 * Calculate a composite health score (0–100).
 * @param {Object} params
 * @returns {Object}
 */
function calculateHealthScore({ pkg, missingFiles, depHealth, unusedDeps, scriptIssues, sizeReport }) {
  const breakdown = {};

  // ── 1. Package metadata (20 pts) ──────────────────────────────
  let metaScore = 20;
  metaScore -= pkg.missingRequired.length    * 8;   // critical fields
  metaScore -= pkg.missingRecommended.length * 1.5; // recommended fields
  if (!pkg.hasEngines)  metaScore -= 1;
  if (!pkg.hasMain && !pkg.hasBin) metaScore -= 2;
  breakdown.metadata = clamp(Math.round(metaScore), 0, 20);

  // ── 2. Missing files (20 pts) ─────────────────────────────────
  let filesScore = 20;
  filesScore -= missingFiles.criticalCount * 10;
  filesScore -= missingFiles.warningCount  *  3;
  const infoMissing = missingFiles.missing.filter(m => m.severity === 'info').length;
  filesScore -= infoMissing * 1;
  breakdown.files = clamp(Math.round(filesScore), 0, 20);

  // ── 3. Dependency health (25 pts) ─────────────────────────────
  let depScore = 25;
  depScore -= depHealth.issueCount       * 5;
  depScore -= depHealth.warningCount     * 2;
  depScore -= depHealth.deprecatedCount  * 3;
  depScore -= depHealth.duplicates.length * 2;
  if (!unusedDeps.skipped) {
    depScore -= unusedDeps.unused.length * 2;
  }
  breakdown.dependencies = clamp(Math.round(depScore), 0, 25);

  // ── 4. npm scripts (15 pts) ───────────────────────────────────
  let scriptScore = 15;
  const criticalDangers = scriptIssues.dangers.filter(d => d.severity === 'critical').length;
  scriptScore -= criticalDangers               * 8;
  scriptScore -= scriptIssues.issueCount       * 3;
  scriptScore -= scriptIssues.placeholders.length * 1;
  breakdown.scripts = clamp(Math.round(scriptScore), 0, 15);

  // ── 5. File hygiene (10 pts) ──────────────────────────────────
  let sizeScore = 10;
  if (!sizeReport.skipped) {
    sizeScore -= sizeReport.largeFiles.length * 3;
    sizeScore -= sizeReport.warnFiles.length  * 1;
  }
  breakdown.fileHygiene = clamp(Math.round(sizeScore), 0, 10);

  // ── 6. Bonus (10 pts) ─────────────────────────────────────────
  let bonus = 0;
  if (pkg.hasEngines)   bonus += 2;
  if (pkg.license && pkg.license !== 'UNLICENSED') bonus += 2;
  if (pkg.hasTypes)     bonus += 2;
  if (pkg.scriptNames.includes('lint')) bonus += 2;
  if (pkg.scriptNames.includes('prepare')) bonus += 2;
  breakdown.bonus = clamp(bonus, 0, 10);

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const finalScore = clamp(score, 0, 100);
  const grade = gradeFromScore(finalScore);

  return {
    score: finalScore,
    grade,
    label: labelFromGrade(grade),
    breakdown,
    maxScores: {
      metadata: 20,
      files: 20,
      dependencies: 25,
      scripts: 15,
      fileHygiene: 10,
      bonus: 10,
    },
  };
}

module.exports = { calculateHealthScore };
