'use strict';

const { calculateHealthScore } = require('../src/analyzers/healthScore');

function makeInput(overrides = {}) {
  return {
    pkg: {
      missingRequired: [],
      missingRecommended: [],
      hasEngines: true,
      hasMain: true,
      hasBin: false,
      hasTypes: false,
      license: 'MIT',
      scriptNames: ['start', 'test', 'lint', 'prepare'],
      depCount: 3,
      devDepCount: 2,
    },
    missingFiles: { missing: [], criticalCount: 0, warningCount: 0 },
    depHealth: { issueCount: 0, warningCount: 0, deprecatedCount: 0, duplicates: [] },
    unusedDeps: { unused: [], skipped: false },
    scriptIssues: { missing: [], dangers: [], placeholders: [], issueCount: 0 },
    sizeReport: { largeFiles: [], warnFiles: [], skipped: false },
    ...overrides,
  };
}

describe('calculateHealthScore()', () => {
  it('returns 100 or close to it for a perfect project', () => {
    const result = calculateHealthScore(makeInput());
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('assigns grade A for high scores', () => {
    const result = calculateHealthScore(makeInput());
    expect(['A', 'B']).toContain(result.grade);
  });

  it('penalises missing required package fields', () => {
    const base = calculateHealthScore(makeInput());
    const withMissing = calculateHealthScore(makeInput({
      pkg: { ...makeInput().pkg, missingRequired: ['name', 'version'] },
    }));
    expect(withMissing.score).toBeLessThan(base.score);
  });

  it('penalises deprecated dependencies', () => {
    const base = calculateHealthScore(makeInput());
    const withDep = calculateHealthScore(makeInput({
      depHealth: { issueCount: 0, warningCount: 0, deprecatedCount: 2, duplicates: [] },
    }));
    expect(withDep.score).toBeLessThan(base.score);
  });

  it('score is clamped between 0 and 100', () => {
    const result = calculateHealthScore(makeInput({
      missingFiles: { missing: Array(10).fill({ severity: 'critical' }), criticalCount: 10, warningCount: 5 },
      depHealth: { issueCount: 10, warningCount: 10, deprecatedCount: 5, duplicates: ['a', 'b'] },
    }));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('provides a breakdown object with all keys', () => {
    const result = calculateHealthScore(makeInput());
    const keys = ['metadata', 'files', 'dependencies', 'scripts', 'fileHygiene', 'bonus'];
    for (const key of keys) {
      expect(result.breakdown).toHaveProperty(key);
    }
  });
});
