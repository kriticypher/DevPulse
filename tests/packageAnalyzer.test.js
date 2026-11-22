'use strict';

const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { analyzePackage } = require('../src/analyzers/packageAnalyzer');

function writePackage(dir, obj) {
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(obj, null, 2));
}

describe('analyzePackage()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devpulse-pkg-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws when package.json is absent', async () => {
    await expect(analyzePackage(tmpDir)).rejects.toThrow('No package.json found');
  });

  it('throws for invalid JSON', async () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{invalid}');
    await expect(analyzePackage(tmpDir)).rejects.toThrow('Invalid JSON');
  });

  it('extracts name and version', async () => {
    writePackage(tmpDir, { name: 'my-app', version: '2.0.0' });
    const pkg = await analyzePackage(tmpDir);
    expect(pkg.name).toBe('my-app');
    expect(pkg.version).toBe('2.0.0');
  });

  it('counts dependencies correctly', async () => {
    writePackage(tmpDir, {
      name: 'x', version: '1.0.0',
      dependencies:    { a: '^1.0', b: '^2.0' },
      devDependencies: { jest: '^29.0' },
    });
    const pkg = await analyzePackage(tmpDir);
    expect(pkg.depCount).toBe(2);
    expect(pkg.devDepCount).toBe(1);
    expect(pkg.totalDeps).toBe(3);
  });

  it('detects missing required fields', async () => {
    writePackage(tmpDir, { description: 'no name or version' });
    const pkg = await analyzePackage(tmpDir);
    expect(pkg.missingRequired).toContain('name');
    expect(pkg.missingRequired).toContain('version');
  });

  it('detects engines and main fields', async () => {
    writePackage(tmpDir, { name: 'x', version: '1.0.0', engines: { node: '>=16' }, main: './src/index.js' });
    const pkg = await analyzePackage(tmpDir);
    expect(pkg.hasEngines).toBe(true);
    expect(pkg.hasMain).toBe(true);
  });

  it('defaults license to UNLICENSED when absent', async () => {
    writePackage(tmpDir, { name: 'x', version: '1.0.0' });
    const pkg = await analyzePackage(tmpDir);
    expect(pkg.license).toBe('UNLICENSED');
  });
});
