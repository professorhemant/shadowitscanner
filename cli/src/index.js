'use strict';

const { Command } = require('commander');
const { runScan } = require('./commands/scan');
const { set } = require('./utils/config');
const { log } = require('./utils/logger');

const program = new Command();

program
  .name('shadow-audit')
  .description('Open-source Shadow IT scanner for Slack & Google Workspace')
  .version(require('../package.json').version);

program
  .command('scan')
  .description('Scan your workspace for third-party app access')
  .option('--slack', 'Scan Slack workspace')
  .option('--google', 'Scan Google Workspace')
  .option('--all', 'Scan both Slack and Google')
  .option('--slack-token <token>', 'Slack bot/user token (or set SLACK_TOKEN)')
  .option('--google-credentials <path>', 'Path to GCP service account JSON (or set GOOGLE_CREDENTIALS)')
  .option('--admin-email <email>', 'Google Workspace admin email for impersonation (or set GOOGLE_ADMIN_EMAIL)')
  .option('--domain <domain>', 'Your Google Workspace domain (e.g. acme.com)')
  .option('--format <fmt>', 'Output format: table | json | html (default: table)', 'table')
  .option('--output <path>', 'Output file path for json/html reports')
  .option('--html', 'Also generate an HTML report (opens in browser)')
  .option('--no-open', 'Do not auto-open HTML report in browser')
  .option('--upload', 'Upload results to Shadow IT Dashboard')
  .option('--strict', 'Exit with error code if any scan fails')
  .action(runScan);

program
  .command('auth')
  .description('Save your Shadow IT Dashboard API token locally')
  .requiredOption('--token <token>', 'Your dashboard API token')
  .action((opts) => {
    set('api_token', opts.token);
    log.success('API token saved. Results will upload when you run scan --upload.');
  });

program.parse(process.argv);
