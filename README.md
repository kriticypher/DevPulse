# 🔬 DevPulse CLI

> **Smart Node.js project health auditor — catch problems before your users do.**

[![npm version](https://img.shields.io/npm/v/devpulse-cli.svg)](https://www.npmjs.com/package/devpulse-cli)
[![Node.js >=16](https://img.shields.io/badge/node-%3E%3D16-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

DevPulse scans your Node.js project and produces a **health score (0–100)** backed by concrete findings across six categories:

| Category | Max pts | What is checked |
|---|---|---|
| Package metadata | 20 | `name`, `version`, `license`, `engines`, `main`/`bin` |
| Missing files | 20 | README, .gitignore, LICENSE, CI config, linting config |
| Dependency health | 25 | Dangerous specifiers, deprecated packages, duplicates, unused |
| npm Scripts | 15 | Missing standard scripts, dangerous shell patterns |
| File hygiene | 10 | Oversized source files |
| Bonus | 10 | Types, lint script, prepare script, explicit license |

---

## 📦 Installation

```bash
# Global install (recommended)
npm install -g devpulse-cli

# Or use directly with npx
npx devpulse-cli audit
```

---

## 🚀 Quick Start

```bash
# Audit the current directory
devpulse audit

# Audit a specific project
devpulse audit /path/to/my-project

# Get just the health score
devpulse score

# Show project metadata
devpulse info
```

---

## 📖 Commands

### `devpulse audit [directory]`

Runs the full project health audit and prints a detailed terminal report.

```
Options:
  -o, --output <format>   Output format: terminal | json  (default: terminal)
  -f, --file <path>       Save JSON report to file (requires --output json)
  --no-color              Disable colored output
  --skip-unused           Skip unused dependency detection
  --skip-size             Skip file size analysis
  --threshold <score>     Exit with code 1 if health score is below threshold
  -h, --help              Display help for command
```

**Examples:**

```bash
# Basic audit
devpulse audit

# Export JSON report
devpulse audit --output json --file report.json

# CI: fail if score drops below 70
devpulse audit --threshold 70

# Audit another project without size check
devpulse audit ~/projects/my-api --skip-size
```

### `devpulse score [directory]`

Prints only the health score and grade. Ideal for quick checks.

```bash
devpulse score
# 🏥 Health Score: 87/100 (B)
```

### `devpulse info [directory]`

Displays project metadata extracted from `package.json`.

```bash
devpulse info
```

---

## 📊 Health Score & Grades

| Grade | Score | Label    |
|-------|-------|----------|
| A     | 90–100 | Excellent |
| B     | 80–89  | Good      |
| C     | 70–79  | Fair      |
| D     | 60–69  | Poor      |
| F     | 0–59   | Critical  |

---

## 🗂️ JSON Report Format

```json
{
  "tool": "devpulse-cli",
  "version": "1.0.0",
  "timestamp": "2026-11-22T13:41:00.000Z",
  "target": "/path/to/project",
  "score": {
    "value": 87,
    "grade": "B",
    "label": "Good",
    "breakdown": { "metadata": 18, "files": 17, "dependencies": 22, ... }
  },
  "findings": {
    "missingFiles": [...],
    "dependencyIssues": [...],
    "unusedDependencies": [...],
    ...
  }
}
```

---

## 🔧 Configuration

DevPulse works **zero-config** — just point it at any Node.js project.

---

## 🏗️ Architecture

```
devpulse-cli/
├── bin/
│   └── devpulse.js          # CLI entry point (executable)
├── src/
│   ├── cli.js               # Commander command definitions
│   ├── index.js             # Audit orchestrator
│   ├── analyzers/
│   │   ├── scanner.js       # Directory tree scanner
│   │   ├── packageAnalyzer.js  # package.json parser
│   │   ├── missingFiles.js  # Required/recommended file checker
│   │   ├── dependencyHealth.js # Dep specifier & deprecation checker
│   │   ├── unusedDeps.js    # Import-based unused dep detector
│   │   ├── scriptValidator.js  # npm script best-practice checker
│   │   ├── fileSizeAnalyzer.js # Oversized file detector
│   │   └── healthScore.js   # Composite score calculator
│   ├── reporters/
│   │   ├── terminalReporter.js # Chalk/boxen terminal output
│   │   └── jsonReporter.js     # JSON export
│   └── utils/
│       ├── constants.js     # Shared constants
│       ├── errors.js        # Custom error classes
│       ├── format.js        # Formatting helpers
│       └── safeRead.js      # Safe file I/O wrappers
├── tests/
│   ├── scanner.test.js
│   ├── packageAnalyzer.test.js
│   ├── dependencyHealth.test.js
│   ├── missingFiles.test.js
│   ├── scriptValidator.test.js
│   ├── healthScore.test.js
│   └── cli.integration.test.js
└── package.json
```

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit your changes with [Conventional Commits](https://www.conventionalcommits.org/)
4. Push and open a PR

---

## 📜 License

[MIT](LICENSE) © Kriti Maurya
