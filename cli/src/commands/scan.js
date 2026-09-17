'use strict';

const path = require('path');
const { scanSlack } = require('../scanners/slack');
const { scanGoogle } = require('../scanners/google');
const { printResults } = require('../reporters/table');
const { toJSON } = require('../reporters/json');
const { writeHTML } = require('../reporters/html');
const { uploadToDashboard } = require('../upload/dashboard');
const { log, spinner } = require('../utils/logger');

async function runScan(opts) {
  const results = [];

  if (opts.slack || opts.all) {
    const token = opts.slackToken || process.env.SLACK_TOKEN;
    if (!token) {
      log.error('Slack token required. Pass --slack-token or set SLACK_TOKEN env var.');
      process.exit(1);
    }
    const spin = spinner('Scanning Slack workspace...').start();
    try {
      const result = await scanSlack(token);
      result.source = 'slack';
      results.push(result);
      spin.succeed(`Slack scan complete — ${result.apps.length} apps found`);
      if (!result.enterprise_grid) {
        log.warn('Non-Enterprise Slack: some admin-level app data may be unavailable.');
      }
    } catch (err) {
      spin.fail(`Slack scan failed: ${err.message}`);
      if (opts.strict) process.exit(1);
    }
  }

  if (opts.google || opts.all) {
    const creds = opts.googleCredentials || process.env.GOOGLE_CREDENTIALS;
    const adminEmail = opts.adminEmail || process.env.GOOGLE_ADMIN_EMAIL;
    const domain = opts.domain || process.env.GOOGLE_DOMAIN;

    if (!creds || !adminEmail) {
      log.error('Google scan requires --google-credentials and --admin-email (or env vars GOOGLE_CREDENTIALS, GOOGLE_ADMIN_EMAIL).');
      process.exit(1);
    }
    const credsPath = path.resolve(creds);
    const spin = spinner('Scanning Google Workspace...').start();
    try {
      const result = await scanGoogle(credsPath, adminEmail, domain);
      result.source = 'google';
      results.push(result);
      spin.succeed(`Google scan complete — ${result.apps.length} apps found`);
    } catch (err) {
      spin.fail(`Google scan failed: ${err.message}`);
      if (opts.strict) process.exit(1);
    }
  }

  if (results.length === 0) {
    log.warn('No scan sources specified. Use --slack, --google, or --all.');
    process.exit(1);
  }

  // Output
  const fmt = opts.format || 'table';

  if (fmt === 'table' || fmt === 'both') {
    printResults(results);
  }

  if (fmt === 'json') {
    const jsonPath = opts.output || `shadow-audit-${Date.now()}.json`;
    toJSON(results, jsonPath);
    log.success(`JSON report saved: ${jsonPath}`);
  }

  if (fmt === 'html' || opts.html) {
    const htmlPath = opts.output || `shadow-audit-report-${Date.now()}.html`;
    writeHTML(results, htmlPath);
    log.success(`HTML report saved: ${htmlPath}`);
    if (!opts.noOpen) {
      try {
        const open = require('open');
        await open(htmlPath);
      } catch { /* non-fatal */ }
    }
  }

  if (opts.upload) {
    const spin = spinner('Uploading to Shadow IT Dashboard...').start();
    const res = await uploadToDashboard(results);
    if (res.success) {
      spin.succeed(`Uploaded! View at: ${res.url}`);
    } else {
      spin.fail(`Upload failed: ${res.reason}`);
    }
  }

  return results;
}

module.exports = { runScan };
