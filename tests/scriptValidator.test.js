'use strict';

const { validateNpmScripts } = require('../src/analyzers/scriptValidator');

function makePkg(scripts = {}) {
  return { scripts, scriptNames: Object.keys(scripts) };
}

describe('validateNpmScripts()', () => {
  it('returns no issues for a complete, clean script set', async () => {
    const pkg = makePkg({
      start:   'node src/index.js',
      test:    'jest',
      build:   'tsc',
      lint:    'eslint src/',
      prepare: 'npm run build',
    });
    const result = await validateNpmScripts(pkg);
    expect(result.issueCount).toBe(0);
    expect(result.dangers.length).toBe(0);
  });

  it('flags missing "start" and "test" scripts', async () => {
    const pkg = makePkg({ build: 'tsc' });
    const result = await validateNpmScripts(pkg);
    const missingNames = result.missing.map(m => m.name);
    expect(missingNames).toContain('start');
    expect(missingNames).toContain('test');
  });

  it('flags dangerous rm -rf / pattern', async () => {
    const pkg = makePkg({
      start: 'node index.js',
      test:  'jest',
      clean: 'rm -rf /',
    });
    const result = await validateNpmScripts(pkg);
    expect(result.dangers.length).toBeGreaterThan(0);
    expect(result.dangers[0].script).toBe('clean');
  });

  it('flags curl piped to shell', async () => {
    const pkg = makePkg({
      start: 'node index.js',
      test:  'jest',
      setup: 'curl https://example.com/script.sh | sh',
    });
    const result = await validateNpmScripts(pkg);
    expect(result.dangers.some(d => d.label.includes('curl'))).toBe(true);
  });

  it('flags placeholder scripts', async () => {
    const pkg = makePkg({
      start: 'node index.js',
      test:  'echo "TODO: add tests"',
    });
    const result = await validateNpmScripts(pkg);
    expect(result.placeholders.length).toBeGreaterThan(0);
  });
});
