'use strict';

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const CLI = path.resolve(__dirname, '../bin/devpulse.js');

function runCli(args, cwd) {
  return spawnSync('node', [CLI, ...args], {
    cwd: cwd || process.cwd(),
    encoding: 'utf8',
    timeout: 15000,
  });
}

describe('DevPulse CLI Integration', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devpulse-int-'));
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      description: 'Integration test project',
      license: 'MIT',
      engines: { node: '>=16' },
      scripts: { start: 'node index.js', test: 'echo ok' },
      dependencies: { chalk: '^4.0.0' },
    }, null, 2));
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Test');
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/');
    fs.writeFileSync(path.join(tmpDir, 'index.js'), "const chalk = require('chalk'); console.log(chalk.green('ok'));");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('shows help when no arguments given', () => {
    const result = runCli(['--help']);
    expect(result.stdout + result.stderr).toMatch(/devpulse/i);
  });

  it('runs audit command and exits cleanly', () => {
    const result = runCli(['audit', tmpDir]);
    expect(result.status).toBe(0);
  });

  it('runs score command and shows a score', () => {
    const result = runCli(['score', tmpDir]);
    expect(result.stdout).toMatch(/Health Score/i);
  });

  it('runs info command and shows project name', () => {
    const result = runCli(['info', tmpDir]);
    expect(result.stdout).toMatch(/test-project/);
  });

  it('exports JSON report', () => {
    const outFile = path.join(tmpDir, 'out.json');
    const result  = runCli(['audit', tmpDir, '--output', 'json', '--file', outFile]);
    expect(result.status).toBe(0);
    expect(fs.existsSync(outFile)).toBe(true);
    const data = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    expect(data.tool).toBe('kriti-devpulse');
    expect(data.score).toBeDefined();
  });

  it('--version flag returns version', () => {
    const result = runCli(['--version']);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
