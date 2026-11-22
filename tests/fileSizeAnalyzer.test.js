'use strict';

const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { analyzeFileSizes, humanSize } = require('../src/analyzers/fileSizeAnalyzer');

describe('fileSizeAnalyzer', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devpulse-filesize-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('formats bytes into human readable units', () => {
    expect(humanSize(500)).toBe('500 B');
    expect(humanSize(2048)).toBe('2.0 KB');
    expect(humanSize(2 * 1024 * 1024)).toBe('2.00 MB');
  });

  it('scans files and calculates total size', async () => {
    fs.writeFileSync(path.join(tmpDir, 'a.js'), 'const a = 1;');
    fs.writeFileSync(path.join(tmpDir, 'b.js'), 'const b = 2;');

    const report = await analyzeFileSizes(tmpDir);
    expect(report.scannedFiles).toBe(2);
    expect(report.totalSize).toBeGreaterThan(0);
    expect(report.largeFiles).toHaveLength(0);
  });
});
