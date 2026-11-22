'use strict';

const chalk = require('chalk');
const boxen = require('boxen');
const path  = require('path');

function hr(char = '─', len = 60) {
  return chalk.gray(char.repeat(len));
}

function icon(severity) {
  const map = { critical: chalk.red('✖'), warning: chalk.yellow('⚠'), info: chalk.blue('ℹ'), ok: chalk.green('✔') };
  return map[severity] || chalk.gray('•');
}

function gradeColor(grade) {
  const map = { A: chalk.bold.green, B: chalk.bold.cyan, C: chalk.bold.yellow, D: chalk.bold.red, F: chalk.bold.bgRed.white };
  return (map[grade] || chalk.white)(grade);
}

function scoreBar(score, max, width = 20) {
  const filled = Math.round((score / max) * width);
  const empty  = width - filled;
  const bar    = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  return `${bar} ${score}/${max}`;
}

/**
 * Render the full audit report to the terminal.
 * @param {Object} report
 */
function formatTerminalReport(report) {
  const { targetDir, pkg, missingFiles, depHealth, unusedDeps, scriptIssues, sizeReport, scoreData, structure } = report;
  const { score, grade, label, breakdown, maxScores } = scoreData;

  console.log('');

  // ── HEADER ────────────────────────────────────────────────────
  const headerBox = boxen(
    chalk.bold.white('DevPulse') + chalk.gray('  |  ') +
    chalk.cyan(pkg.name + '@' + pkg.version) + '\n' +
    chalk.gray(targetDir),
    { padding: 1, margin: 0, borderStyle: 'round', borderColor: 'cyan' }
  );
  console.log(headerBox);

  // ── HEALTH SCORE ──────────────────────────────────────────────
  const scoreBox = boxen(
    chalk.bold('Health Score') + '\n\n' +
    '  ' + gradeColor(grade) + '  ' + chalk.bold.white(`${score}/100`) + '  ' + chalk.gray(label) + '\n\n' +
    Object.entries(breakdown).map(([key, val]) => {
      const max  = maxScores[key] || 10;
      const pct  = Math.round((val / max) * 100);
      const label = key.padEnd(14);
      return `  ${label} ${scoreBar(val, max)}  ${chalk.gray(pct + '%')}`;
    }).join('\n'),
    { padding: 1, margin: 0, borderStyle: 'double', borderColor: grade === 'A' ? 'green' : grade === 'F' ? 'red' : 'yellow' }
  );
  console.log('\n' + scoreBox);

  // ── PROJECT OVERVIEW ──────────────────────────────────────────
  console.log('\n' + chalk.bold.white('📁 Project Overview'));
  console.log(hr());
  console.log(`  ${chalk.gray('Name           ')} ${chalk.cyan(pkg.name)}`);
  console.log(`  ${chalk.gray('Version        ')} ${chalk.white(pkg.version)}`);
  console.log(`  ${chalk.gray('License        ')} ${chalk.white(pkg.license)}`);
  console.log(`  ${chalk.gray('Dependencies   ')} ${chalk.white(pkg.depCount + ' production, ' + pkg.devDepCount + ' dev')}`);
  console.log(`  ${chalk.gray('Scripts        ')} ${chalk.white(pkg.scriptNames.length + ' defined')}`);
  console.log(`  ${chalk.gray('Files scanned  ')} ${chalk.white(structure.totalFiles + ' files in ' + structure.totalDirs + ' dirs')}`);

  // ── MISSING FILES ─────────────────────────────────────────────
  if (missingFiles.missing.length > 0) {
    console.log('\n' + chalk.bold.white('📂 Missing Files'));
    console.log(hr());
    for (const f of missingFiles.missing) {
      console.log(`  ${icon(f.severity)} ${chalk.white(f.file.padEnd(22))} ${chalk.gray(f.reason)}`);
    }
  } else {
    console.log('\n' + chalk.bold.white('📂 Missing Files'));
    console.log(hr());
    console.log('  ' + chalk.green('✔ All recommended files are present.'));
  }

  // ── DEPENDENCY HEALTH ─────────────────────────────────────────
  console.log('\n' + chalk.bold.white('📦 Dependency Health'));
  console.log(hr());
  if (depHealth.issues.length === 0 && depHealth.warnings.length === 0 && depHealth.deprecated.length === 0) {
    console.log('  ' + chalk.green('✔ No dependency issues detected.'));
  } else {
    for (const issue of depHealth.issues) {
      console.log(`  ${icon('critical')} ${chalk.white(issue.name.padEnd(28))} ${chalk.red(issue.reason)}`);
    }
    for (const warn of depHealth.warnings) {
      console.log(`  ${icon('warning')} ${chalk.white(warn.name.padEnd(28))} ${chalk.yellow(warn.reason)}`);
    }
    for (const dep of depHealth.deprecated) {
      console.log(`  ${icon('warning')} ${chalk.white(dep.name.padEnd(28))} ${chalk.magenta('DEPRECATED: ' + dep.advice)}`);
    }
  }

  // ── UNUSED DEPENDENCIES ───────────────────────────────────────
  if (!unusedDeps.skipped) {
    console.log('\n' + chalk.bold.white('🔍 Unused Dependencies'));
    console.log(hr());
    if (unusedDeps.unused.length === 0) {
      console.log('  ' + chalk.green('✔ No unused production dependencies detected.'));
    } else {
      console.log('  ' + chalk.yellow(`${unusedDeps.unused.length} potentially unused package(s):`));
      for (const name of unusedDeps.unused.slice(0, 10)) {
        console.log(`  ${icon('info')} ${chalk.white(name)}`);
      }
      if (unusedDeps.unused.length > 10) {
        console.log(chalk.gray(`  … and ${unusedDeps.unused.length - 10} more.`));
      }
    }
  }

  // ── SCRIPT VALIDATION ─────────────────────────────────────────
  console.log('\n' + chalk.bold.white('⚙  npm Scripts'));
  console.log(hr());
  if (scriptIssues.missing.length === 0 && scriptIssues.dangers.length === 0) {
    console.log('  ' + chalk.green('✔ All recommended scripts are present. No dangerous patterns found.'));
  } else {
    for (const m of scriptIssues.missing) {
      console.log(`  ${icon(m.severity)} ${chalk.white(('Missing "' + m.name + '"').padEnd(30))} ${chalk.gray(m.reason)}`);
    }
    for (const d of scriptIssues.dangers) {
      console.log(`  ${icon(d.severity)} ${chalk.red(`Dangerous pattern "${d.label}" in "${d.script}"`)}`);
    }
  }

  // ── FILE SIZE ─────────────────────────────────────────────────
  if (!sizeReport.skipped) {
    console.log('\n' + chalk.bold.white('📊 File Size Report'));
    console.log(hr());
    console.log(`  ${chalk.gray('Total source size: ')} ${chalk.white(sizeReport.totalSizeHuman)} across ${sizeReport.scannedFiles} files`);
    if (sizeReport.largeFiles.length > 0) {
      console.log('  ' + chalk.yellow('Large files detected:'));
      for (const f of sizeReport.largeFiles.slice(0, 5)) {
        console.log(`  ${icon('warning')} ${chalk.white(f.file.padEnd(40))} ${chalk.yellow(f.human)}`);
      }
    } else {
      console.log('  ' + chalk.green('✔ No oversized source files found.'));
    }
  }

  // ── FOOTER ────────────────────────────────────────────────────
  console.log('\n' + hr('─', 60));
  const tips = [];
  if (grade === 'F' || grade === 'D') tips.push(chalk.red('⚡ Fix critical issues to improve your project health.'));
  if (missingFiles.missing.some(f => f.file === 'README.md')) tips.push(chalk.yellow('📝 Add a README.md to document your project.'));
  if (!pkg.hasEngines) tips.push(chalk.blue('💡 Add an "engines" field to package.json to declare Node.js requirements.'));
  if (tips.length > 0) {
    console.log(chalk.bold.white('💡 Tips'));
    tips.forEach(t => console.log('  ' + t));
  }
  console.log(hr('─', 60) + '\n');
}

module.exports = { formatTerminalReport };
