'use strict';

const Table = require('cli-table3');
const chalk = require('chalk');
const { risk } = require('../utils/logger');

const LEVEL_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function printSummary(apps, source, workspace) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const a of apps) counts[a.risk_level]++;

  console.log();
  console.log(chalk.bold.white('━'.repeat(70)));
  console.log(chalk.bold.white(`  Shadow IT Scan — ${source.toUpperCase()}`));
  if (workspace?.team || workspace?.domain) {
    console.log(chalk.dim(`  Workspace: ${workspace.team || workspace.domain}`));
  }
  console.log(chalk.bold.white('━'.repeat(70)));
  console.log();
  console.log(
    `  ${risk.badge('critical')} ${chalk.bold(counts.critical)}   ` +
    `${risk.badge('high')} ${chalk.bold(counts.high)}   ` +
    `${risk.badge('medium')} ${chalk.bold(counts.medium)}   ` +
    `${risk.badge('low')} ${chalk.bold(counts.low)}`
  );
  console.log(`  ${chalk.dim('Total apps found:')} ${chalk.bold(apps.length)}`);
  console.log();
}

function printTable(apps) {
  const sorted = [...apps].sort((a, b) => LEVEL_ORDER[a.risk_level] - LEVEL_ORDER[b.risk_level]);

  const table = new Table({
    head: [
      chalk.bold('App Name'),
      chalk.bold('Risk'),
      chalk.bold('Score'),
      chalk.bold('Top Scopes'),
      chalk.bold('Verified'),
    ],
    colWidths: [28, 12, 8, 30, 10],
    style: { head: [], border: ['dim'] },
    wordWrap: true,
  });

  for (const app of sorted) {
    const topScopes = (app.scopes || []).slice(0, 2).join(', ') || '(none)';
    const scoreStr = scoreColor(app.risk_score, app.risk_level);
    table.push([
      chalk.white(truncate(app.app_name, 26)),
      risk.badge(app.risk_level),
      scoreStr,
      chalk.dim(truncate(topScopes, 28)),
      app.is_verified ? chalk.green('✔ yes') : chalk.red('✖ no'),
    ]);
  }

  console.log(table.toString());
  console.log();
}

function printCTA() {
  console.log(chalk.dim('─'.repeat(70)));
  console.log(
    chalk.cyan.bold('  ✦ Upload results to Shadow IT Dashboard for history, alerts & team reports:')
  );
  console.log(chalk.white.bold('    https://shadowit.app'));
  console.log(chalk.dim('  Run: shadow-audit auth --token <API_KEY>  then  shadow-audit scan --upload'));
  console.log(chalk.dim('─'.repeat(70)));
  console.log();
}

function scoreColor(score, level) {
  const s = String(score).padStart(3);
  if (level === 'critical') return chalk.red.bold(s);
  if (level === 'high') return chalk.yellow.bold(s);
  if (level === 'medium') return chalk.blue(s);
  return chalk.green(s);
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

function printResults(results) {
  for (const r of results) {
    printSummary(r.apps, r.source || 'combined', r.workspace);
    if (r.apps.length > 0) {
      printTable(r.apps);
    } else {
      console.log(chalk.dim('  No apps found.\n'));
    }
  }
  printCTA();
}

module.exports = { printResults, printSummary, printTable, printCTA };
