'use strict';

const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

const { scanDirectory } = require('./analyzers/scanner');
const { analyzePackage } = require('./analyzers/packageAnalyzer');
const { checkMissingFiles } = require('./analyzers/missingFiles');
const { checkDependencyHealth } = require('./analyzers/dependencyHealth');
const { detectUnusedDependencies } = require('./analyzers/unusedDeps');
const { validateNpmScripts } = require('./analyzers/scriptValidator');
const { analyzeFileSizes } = require('./analyzers/fileSizeAnalyzer');
const { calculateHealthScore } = require('./analyzers/healthScore');
const { formatTerminalReport } = require('./reporters/terminalReporter');
const { exportJsonReport } = require('./reporters/jsonReporter');

async function runAudit(targetDir, options = {}) {
  const spinner = ora({ text: chalk.cyan('Scanning project…'), spinner: 'dots' }).start();

  try {
    // --- gather all data ---
    const [structure, pkg, missingFiles] = await Promise.all([
      scanDirectory(targetDir),
      analyzePackage(targetDir),
      checkMissingFiles(targetDir),
    ]);

    spinner.text = chalk.cyan('Analyzing dependencies…');
    const depHealth = await checkDependencyHealth(pkg);

    spinner.text = chalk.cyan('Detecting unused dependencies…');
    const unusedDeps = options.skipUnused
      ? { unused: [], skipped: true }
      : await detectUnusedDependencies(targetDir, pkg);

    spinner.text = chalk.cyan('Validating npm scripts…');
    const scriptIssues = await validateNpmScripts(pkg);

    spinner.text = chalk.cyan('Analysing file sizes…');
    const sizeReport = options.skipSize
      ? { largeFiles: [], skipped: true }
      : await analyzeFileSizes(targetDir);

    spinner.text = chalk.cyan('Computing health score…');
    const scoreData = calculateHealthScore({
      pkg,
      missingFiles,
      depHealth,
      unusedDeps,
      scriptIssues,
      sizeReport,
    });

    spinner.succeed(chalk.green('Audit complete'));

    const report = {
      targetDir,
      timestamp: new Date().toISOString(),
      structure,
      pkg,
      missingFiles,
      depHealth,
      unusedDeps,
      scriptIssues,
      sizeReport,
      scoreData,
    };

    if (options.output === 'json') {
      const outPath = options.file || path.join(targetDir, 'devpulse-report.json');
      await exportJsonReport(report, outPath);
      console.log(chalk.green(`\n📄 JSON report saved to: ${outPath}`));
    } else if (options.output === 'score') {
      const { score, grade } = scoreData;
      console.log(chalk.bold(`\n🏥 Health Score: ${score}/100 (${grade})\n`));
    } else {
      formatTerminalReport(report);
    }

    // threshold check
    if (options.threshold && scoreData.score < options.threshold) {
      process.exitCode = 1;
    }

    return report;
  } catch (err) {
    spinner.fail(chalk.red('Audit failed'));
    throw err;
  }
}

async function getProjectInfo(targetDir) {
  const pkg = await analyzePackage(targetDir);
  return pkg;
}

module.exports = { runAudit, getProjectInfo };
