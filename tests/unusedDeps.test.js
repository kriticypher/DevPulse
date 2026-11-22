'use strict';

const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { detectUnusedDependencies } = require('../src/analyzers/unusedDeps');

describe('detectUnusedDependencies()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devpulse-unused-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('identifies imported packages as used', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'app.js'),
      "const chalk = require('chalk');\nimport lodash from 'lodash';\n"
    );

    const pkg = {
      deps: {
        chalk: '^4.1.2',
        lodash: '^4.17.21',
        unusedPkg: '^1.0.0',
      },
    };

    const result = await detectUnusedDependencies(tmpDir, pkg);
    expect(result.unused).toContain('unusedPkg');
    expect(result.unused).not.toContain('chalk');
    expect(result.unused).not.toContain('lodash');
  });

  it('safeguards toolchain packages from unused list', async () => {
    const pkg = {
      deps: {
        typescript: '^5.0.0',
        eslint: '^8.0.0',
      },
    };

    const result = await detectUnusedDependencies(tmpDir, pkg);
    expect(result.unused).not.toContain('typescript');
    expect(result.unused).not.toContain('eslint');
  });
});
