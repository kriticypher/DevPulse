'use strict';

const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { scanDirectory } = require('../src/analyzers/scanner');

describe('scanDirectory()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devpulse-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('detects package.json at root', async () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
    const result = await scanDirectory(tmpDir);
    expect(result.hasPackageJson).toBe(true);
  });

  it('counts files and directories correctly', async () => {
    fs.writeFileSync(path.join(tmpDir, 'index.js'), '');
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '');
    fs.mkdirSync(path.join(tmpDir, 'src'));
    fs.writeFileSync(path.join(tmpDir, 'src', 'app.js'), '');

    const result = await scanDirectory(tmpDir);
    expect(result.totalFiles).toBe(3);
    expect(result.totalDirs).toBe(1);
  });

  it('ignores node_modules', async () => {
    fs.mkdirSync(path.join(tmpDir, 'node_modules'));
    fs.writeFileSync(path.join(tmpDir, 'node_modules', 'pkg.js'), '');
    const result = await scanDirectory(tmpDir);
    expect(result.totalFiles).toBe(0);
    expect(result.hasNodeModules).toBe(true);
  });

  it('detects src and test directories', async () => {
    fs.mkdirSync(path.join(tmpDir, 'src'));
    fs.mkdirSync(path.join(tmpDir, 'tests'));
    const result = await scanDirectory(tmpDir);
    expect(result.hasSrcDir).toBe(true);
    expect(result.hasTestDir).toBe(true);
  });

  it('throws for non-existent directory', async () => {
    await expect(scanDirectory('/does/not/exist')).rejects.toThrow('Directory not found');
  });

  it('tracks file extensions', async () => {
    fs.writeFileSync(path.join(tmpDir, 'a.js'), '');
    fs.writeFileSync(path.join(tmpDir, 'b.js'), '');
    fs.writeFileSync(path.join(tmpDir, 'c.ts'), '');
    const result = await scanDirectory(tmpDir);
    expect(result.extensions['.js']).toBe(2);
    expect(result.extensions['.ts']).toBe(1);
  });
});
