'use strict';

const { Command } = require('commander');
const chalk = require('chalk');
const { version } = require('../package.json');
const { runAudit } = require('./index');

const program = new Command();

program
  .name('devpulse')
  .description('DevPulse — Smart Node.js project health auditor')
  .version(version, '-v, --version', 'Display DevPulse version');

program
  .command('audit [directory]')
  .alias('a')
  .description('Run a full health audit on a Node.js project')
  .option('-o, --output <format>', 'Output format: terminal | json', 'terminal')
  .option('-f, --file <path>', 'Save JSON report to file (requires --output json)')
  .option('--no-color', 'Disable colored output')
  .option('--skip-unused', 'Skip unused dependency detection')
  .option('--skip-size', 'Skip file size analysis')
  .option('--threshold <score>', 'Exit with code 1 if health score below threshold', parseInt)
  .action(async (directory, options) => {
    const targetDir = directory
      ? require('path').resolve(directory)
      : process.cwd();

    try {
      await runAudit(targetDir, options);
    } catch (err) {
      console.error(chalk.red('\n✖ Fatal error: ' + err.message));
      process.exit(1);
    }
  });

program
  .command('score [directory]')
  .alias('s')
  .description('Quick health score only — no full report')
  .action(async (directory) => {
    const path = require('path');
    const targetDir = directory ? path.resolve(directory) : process.cwd();
    const { runAudit } = require('./index');
    try {
      await runAudit(targetDir, { output: 'score', skipUnused: false, skipSize: false });
    } catch (err) {
      console.error(chalk.red('\n✖ ' + err.message));
      process.exit(1);
    }
  });

program
  .command('info [directory]')
  .alias('i')
  .description('Display project metadata')
  .action(async (directory) => {
    const path = require('path');
    const { getProjectInfo } = require('./analyzers/packageAnalyzer');
    const targetDir = directory ? path.resolve(directory) : process.cwd();
    try {
      const info = await getProjectInfo(targetDir);
      console.log(chalk.bold.cyan('\n📦 Project Info'));
      console.log(chalk.gray('─'.repeat(40)));
      Object.entries(info).forEach(([k, v]) => {
        console.log(chalk.white(`  ${k.padEnd(16)} `) + chalk.yellow(String(v)));
      });
      console.log('');
    } catch (err) {
      console.error(chalk.red('✖ ' + err.message));
      process.exit(1);
    }
  });

// Default: show help if no args
if (process.argv.length < 3) {
  program.help();
}

program.parse(process.argv);
