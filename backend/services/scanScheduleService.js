'use strict';

const { Workspace, ScanRun, AlertConfig } = require('../models');
const { Op } = require('sequelize');
const { scanSlack } = require('./slackScanner');
const { scanGoogle } = require('./googleScanner');
const { scanMicrosoft } = require('./microsoftScanner');
const { scanOkta } = require('./oktaScanner');
const { scanGithub } = require('./githubScanner');
const { scanJira } = require('./jiraScanner');
const { persistScanResults } = require('../controllers/scanController');
const { sendAlertEmail } = require('./emailService');

const LEVEL_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function computeNextRun(frequency, hour, day) {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);

  if (frequency === 'daily') {
    next.setUTCHours(hour);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  if (frequency === 'weekly') {
    next.setUTCHours(hour);
    const currentDay = now.getUTCDay();
    let daysUntil = (day - currentDay + 7) % 7;
    if (daysUntil === 0 && next <= now) daysUntil = 7;
    next.setUTCDate(next.getUTCDate() + daysUntil);
    return next;
  }

  if (frequency === 'monthly') {
    next.setUTCHours(hour);
    next.setUTCDate(day);
    if (next <= now) {
      next.setUTCMonth(next.getUTCMonth() + 1);
      next.setUTCDate(day);
    }
    return next;
  }

  return null;
}

async function runWorkspaceScan(ws) {
  const run = await ScanRun.create({
    workspace_id: ws.id,
    triggered_by: 'scheduled',
    source: ws.type,
    status: 'running',
    started_at: new Date(),
  });

  try {
    let apps = [];
    if (ws.type === 'slack')     { const r = await scanSlack(ws);     apps = r.apps; }
    else if (ws.type === 'google')    { const r = await scanGoogle(ws);    apps = r.apps; }
    else if (ws.type === 'microsoft') { const r = await scanMicrosoft(ws); apps = r.apps; }
    else if (ws.type === 'okta')      { const r = await scanOkta(ws);      apps = r.apps; }
    else if (ws.type === 'github')    { const r = await scanGithub(ws);    apps = r.apps; }
    else if (ws.type === 'jira')      { const r = await scanJira(ws);      apps = r.apps; }

    await persistScanResults(ws.id, ws.type, apps, 'scheduled', run.id);

    // Send alert email if configured
    const alertCfg = await AlertConfig.findOne({ where: { workspace_id: ws.id, enabled: true } });
    const emailTo = ws.schedule_notify_email
      ? [ws.schedule_notify_email]
      : alertCfg?.email_recipients || [];

    if (emailTo.length && apps.length) {
      const threshold = LEVEL_ORDER[alertCfg?.min_risk_level || 'high'];
      const risky = apps.filter(a => LEVEL_ORDER[a.risk_level] <= threshold);
      if (risky.length) {
        await sendAlertEmail({ recipients: emailTo, workspaceName: ws.name, newApps: risky });
      }
    }

    console.log(`Scheduled scan complete: workspace=${ws.id} apps=${apps.length}`);
  } catch (err) {
    await run.update({ status: 'failed', error_message: err.message, completed_at: new Date() });
    console.error(`Scheduled scan failed workspace=${ws.id}:`, err.message);
  }

  // Compute and store next run
  const nextRun = computeNextRun(ws.schedule_frequency, ws.schedule_hour, ws.schedule_day);
  await ws.update({ schedule_next_run: nextRun });
}

async function runScheduledScans() {
  const now = new Date();
  const workspaces = await Workspace.findAll({
    where: {
      schedule_frequency: { [Op.ne]: 'off' },
      schedule_next_run: { [Op.lte]: now },
    },
  });

  if (workspaces.length) {
    console.log(`Running ${workspaces.length} scheduled scan(s)`);
  }

  for (const ws of workspaces) {
    // Advance next_run immediately to prevent double-firing
    const nextRun = computeNextRun(ws.schedule_frequency, ws.schedule_hour, ws.schedule_day);
    await ws.update({ schedule_next_run: nextRun });
    runWorkspaceScan(ws).catch(err => console.error('Schedule error:', err.message));
  }
}

module.exports = { runScheduledScans, computeNextRun };
