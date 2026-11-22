# DevPulse CLI — Examples & Recipes

## Basic Usage

```bash
# Audit the current directory (most common)
devpulse audit

# Audit a specific project path
devpulse audit /Users/me/projects/my-api
devpulse audit ~/Desktop/my-app
```

## CI/CD Integration

```bash
# GitHub Actions — fail the pipeline if score < 75
devpulse audit --threshold 75

# GitLab CI — export JSON artifact for later review
devpulse audit --output json --file devpulse-report.json
```

### GitHub Actions Example

```yaml
# .github/workflows/quality.yml
name: Quality Gate

on: [push, pull_request]

jobs:
  devpulse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install -g kriti-devpulse
      - run: devpulse audit --threshold 70
```

## Output Formats

```bash
# Default colored terminal output
devpulse audit

# Plain terminal (no color — for logs/CI)
devpulse audit --no-color

# JSON to stdout (pipe-friendly)
devpulse audit --output json

# JSON saved to a file
devpulse audit --output json --file ./reports/health.json
```

## Partial Scans

```bash
# Skip unused-dependency detection (faster for large monorepos)
devpulse audit --skip-unused

# Skip file-size analysis
devpulse audit --skip-size

# Skip both for a quick metadata + script + dep check
devpulse audit --skip-unused --skip-size
```

## Quick Commands

```bash
# Just the score (ideal for a pre-commit hook or status bar)
devpulse score

# Project metadata summary
devpulse info

# Version check
devpulse --version
```

## Pre-commit Hook (Husky)

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "devpulse audit --threshold 65 --skip-size"
    }
  }
}
```

## Monorepo — Scan Each Package

```bash
for pkg in packages/*/; do
  echo "\n=== Auditing $pkg ==="
  devpulse audit "$pkg" --skip-unused
done
```

## Programmatic API

```js
const { runAudit } = require('kriti-devpulse');

const report = await runAudit('/path/to/project', {
  output: 'json',
  skipUnused: false,
  skipSize: false,
});

console.log('Score:', report.scoreData.score);
console.log('Grade:', report.scoreData.grade);
```
