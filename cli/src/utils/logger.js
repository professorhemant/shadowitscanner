'use strict';

const chalk = require('chalk');
const ora = require('ora');

const log = {
  info: (msg) => console.log(chalk.cyan('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✔'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.log(chalk.red('✖'), msg),
  dim: (msg) => console.log(chalk.dim(msg)),
  blank: () => console.log(),
};

function spinner(text) {
  return ora({ text, color: 'cyan' });
}

const risk = {
  critical: (t) => chalk.bgRed.white.bold(` ${t} `),
  high: (t) => chalk.red.bold(t),
  medium: (t) => chalk.yellow(t),
  low: (t) => chalk.green(t),
  badge: (level) => {
    const map = {
      critical: chalk.bgRed.white.bold(' CRITICAL '),
      high: chalk.bgYellow.black.bold('   HIGH   '),
      medium: chalk.bgBlue.white('  MEDIUM  '),
      low: chalk.bgGreen.black('   LOW    '),
    };
    return map[level] || level;
  },
};

module.exports = { log, spinner, risk };
