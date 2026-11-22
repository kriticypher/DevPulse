'use strict';

const { checkDependencyHealth } = require('../src/analyzers/dependencyHealth');

function makePkg(deps = {}, devDeps = {}) {
  return {
    deps, devDeps, peerDeps: {}, optDeps: {},
    depCount: Object.keys(deps).length,
    devDepCount: Object.keys(devDeps).length,
    scripts: {},
  };
}

describe('checkDependencyHealth()', () => {
  it('returns no issues for clean deps', async () => {
    const pkg = makePkg({ lodash: '^4.17.21', chalk: '^4.0.0' });
    const result = await checkDependencyHealth(pkg);
    expect(result.issueCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });

  it('flags dangerous wildcard specifier', async () => {
    const pkg = makePkg({ danger: '*' });
    const result = await checkDependencyHealth(pkg);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].name).toBe('danger');
  });

  it('flags known deprecated package', async () => {
    const pkg = makePkg({ request: '^2.88.2' });
    const result = await checkDependencyHealth(pkg);
    expect(result.deprecated.length).toBeGreaterThan(0);
    expect(result.deprecated[0].name).toBe('request');
  });

  it('detects duplicate across dep groups', async () => {
    const pkg = makePkg({ lodash: '^4.0.0' }, { lodash: '^4.0.0' });
    const result = await checkDependencyHealth(pkg);
    expect(result.duplicates).toContain('lodash');
  });

  it('flags dangerous "latest" specifier', async () => {
    const pkg = makePkg({ unstable: 'latest' });
    const result = await checkDependencyHealth(pkg);
    expect(result.issues.some(i => i.name === 'unstable')).toBe(true);
  });
});
