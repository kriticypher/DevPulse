# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-11-22

### Added
- `devpulse audit` command — full project health audit with colored terminal output
- `devpulse score` command — quick health score display
- `devpulse info` command — project metadata summary
- Directory scanner (`src/analyzers/scanner.js`)
- package.json analyzer (`src/analyzers/packageAnalyzer.js`)
- Missing files detector (`src/analyzers/missingFiles.js`)
- Dependency health checker — flags dangerous specifiers, deprecated packages, duplicates
- Unused dependency detector — import-based static analysis
- npm script validator — checks for missing/dangerous scripts
- File size analyzer — flags oversized source files
- Health score engine — composite 0–100 score with letter grades (A–F)
- Terminal reporter with chalk + boxen
- JSON report exporter
- `--output json` flag for CI-friendly output
- `--threshold <score>` flag for pipeline quality gates
- `--skip-unused` and `--skip-size` flags for faster partial scans
- `--no-color` flag for log-safe output
- `-f / --file` flag to save JSON report to a custom path
- Custom error classes (`DevPulseError`, `PackageNotFoundError`, etc.)
- Shared utilities: constants, format helpers, safe file I/O
- Full test suite (Jest) covering all analyzers + CLI integration
- README.md with installation, usage, and architecture guide
- docs/CLI_EXAMPLES.md with CI/CD recipes and advanced usage

### Notes
- Requires Node.js >=16.0.0 and npm >=7.0.0
