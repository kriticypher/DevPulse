'use strict';

const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { checkMissingFiles } = require('../src/analyzers/missingFiles');

describe('checkMissingFiles()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devpulse-mf-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reports all files missing for empty dir', async () => {
    const result = await checkMissingFiles(tmpDir);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.criticalCount).toBe(1); // package.json is critical
  });

  it('detects README.md as present when it exists', async () => {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Test');
    const result = await checkMissingFiles(tmpDir);
    expect(result.present.some(p => p.file === 'README.md')).toBe(true);
  });

  it('detects .gitignore as present', async () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/');
    const result = await checkMissingFiles(tmpDir);
    expect(result.present.some(p => p.file === '.gitignore')).toBe(true);
  });

  it('reports fewer missing files for a fuller project', async () => {
    const before = await checkMissingFiles(tmpDir);
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# X');
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), '');
    fs.writeFileSync(path.join(tmpDir, 'LICENSE'), 'MIT');
    const after = await checkMissingFiles(tmpDir);
    expect(after.missing.length).toBeLessThan(before.missing.length);
  });
});
