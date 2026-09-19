'use strict';

const { Workspace, ScanRun, DiscoveredApp, WhitelistedApp, AlertConfig, NudgeLog } = require('../models');
const { scanSlack } = require('../services/slackScanner');
const { scanGoogle } = require('../services/googleScanner');
const { scanMicrosoft } = require('../services/microsoftScanner');
const { scanOkta } = require('../services/oktaScanner');
const { scanGithub } = require('../services/githubScanner');
const { scanJira } = require('../services/jiraScanner');
const { scanConfluence } = require('../services/confluenceScanner');
const { sendAlertEmail, sendNudgeEmail } = require('../services/emailService');
const { fireForApps, fireEvent } = require('../services/webhookService');
const { logAction } = require('../utils/audit');

async function persistScanResults(workspaceId, source, apps, triggeredBy, scanRunId) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const a of apps) counts[a.risk_level]++;

  const run = await ScanRun.findByPk(scanRunId);
  await run.update({
    status: 'completed',
    apps_found: apps.length,
    critical_count: counts.critical,
    high_count: counts.high,
    medium_count: counts.medium,
    low_count: counts.low,
    completed_at: new Date(),
  });

  await DiscoveredApp.bulkCreate(
    apps.map(a => ({
      scan_run_id: scanRunId,
      workspace_id: workspaceId,
      source: a.source,
      app_id: a.app_id,
      app_name: a.app_name,
      app_description: a.app_description || '',
      developer: a.developer || '',
      developer_url: a.developer_url || '',
      icon_url: a.icon_url || '',
      scopes: a.scopes,
      raw_data: a.raw_data || {},
      is_verified: !!a.is_verified,
      risk_score: a.risk_score,
      risk_level: a.risk_level,
      risk_factors: a.risk_factors,
      has_admin_scope: !!a.has_admin_scope,
      has_write_scope: !!a.has_write_scope,
      accesses_email: !!a.accesses_email,
      accesses_calendar: !!a.accesses_calendar,
      accesses_drive: !!a.accesses_drive,
      external_domain: !!a.external_domain,
      user_count: a.user_count || 0,
      is_ai_tool: !!a.is_ai_tool,
      ai_risk_flags: a.ai_risk_flags || null,
      first_seen_at: a.first_seen_at || new Date(),
      last_seen_at: a.last_seen_at || new Date(),
    })),
    { ignoreDuplicates: true }
  );

  await Workspace.update({ last_scan_at: new Date() }, { where: { id: workspaceId } });

  // Fire webhooks async (don't block)
  fireForApps(workspaceId, apps, scanRunId).catch(() => {});
  fireEvent(workspaceId, 'scan.completed', {
    scan_run_id: scanRunId,
    apps_found: apps.length,
    critical_count: counts.critical,
    high_count: counts.high,
    source,
  }).catch(() => {});

  return run;
}

function hasCredentials(ws) {
  switch (ws.type) {
    case 'slack':      return !!(ws.slack_bot_token);
    case 'google':     return !!(ws.google_service_account && ws.google_admin_email);
    case 'microsoft':  return !!(ws.ms_tenant_id && ws.ms_client_id && ws.ms_client_secret);
    case 'okta':       return !!(ws.okta_domain && ws.okta_api_token);
    case 'github':     return !!(ws.github_org && ws.github_pat);
    case 'jira':       return !!(ws.jira_domain && ws.jira_email && ws.jira_api_token);
    case 'confluence': return !!(ws.confluence_domain && ws.confluence_email && ws.confluence_api_token);
    default:           return false;
  }
}

async function triggerScan(req, res, next) {
  try {
    const { workspace_id, source } = req.body;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    if (!hasCredentials(ws)) {
      return res.status(400).json({
        message: `No credentials configured for this ${ws.type} workspace. Go to Connect Workspace to add your API token.`,
        code: 'missing_credentials',
      });
    }

    const run = await ScanRun.create({
      workspace_id, triggered_by: 'manual',
      source: source || ws.type, status: 'running', started_at: new Date(),
    });

    logAction(req, workspace_id, 'scan.start', 'scan_run', run.id, ws.name, { source: source || ws.type });
    res.status(202).json({ scan_run_id: run.id, message: 'Scan started' });

    // Run scan async
    (async () => {
      try {
        let apps = [];
        if (ws.type === 'slack' || source === 'slack') {
          const result = await scanSlack(ws);
          apps = result.apps;
        } else if (ws.type === 'google' || source === 'google') {
          const result = await scanGoogle(ws);
          apps = result.apps;
        } else if (ws.type === 'microsoft' || source === 'microsoft') {
          const result = await scanMicrosoft(ws);
          apps = result.apps;
        } else if (ws.type === 'okta' || source === 'okta') {
          const result = await scanOkta(ws);
          apps = result.apps;
        } else if (ws.type === 'github' || source === 'github') {
          const result = await scanGithub(ws);
          apps = result.apps;
        } else if (ws.type === 'jira' || source === 'jira') {
          const result = await scanJira(ws);
          apps = result.apps;
        } else if (ws.type === 'confluence' || source === 'confluence') {
          const result = await scanConfluence(ws);
          apps = result.apps;
        }

        await persistScanResults(workspace_id, ws.type, apps, 'manual', run.id);

        // Check alerts
        const alertCfg = await AlertConfig.findOne({ where: { workspace_id, enabled: true } });
        if (alertCfg?.notify_on_new && alertCfg.email_recipients?.length) {
          const LEVEL_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
          const threshold = LEVEL_ORDER[alertCfg.min_risk_level];
          const risky = apps.filter(a => LEVEL_ORDER[a.risk_level] <= threshold);
          if (risky.length > 0) {
            await sendAlertEmail({ recipients: alertCfg.email_recipients, workspaceName: ws.name, newApps: risky });
          }
          // Auto-nudge: send per-app nudges for Critical + High apps
          const nudgeApps = apps.filter(a => a.risk_level === 'critical' || a.risk_level === 'high');
          for (const a of nudgeApps) {
            try {
              await sendNudgeEmail({ recipients: alertCfg.email_recipients, workspaceName: ws.name, app: a });
              await NudgeLog.create({
                workspace_id,
                app_id: a.app_id,
                app_name: a.app_name,
                source: a.source,
                risk_level: a.risk_level,
                risk_score: a.risk_score,
                user_count: a.user_count || 0,
                recipients: alertCfg.email_recipients,
                nudge_type: 'auto',
              });
            } catch (_) {}
          }
        }
      } catch (err) {
        await run.update({ status: 'failed', error_message: err.message, completed_at: new Date() });
      }
    })();
  } catch (err) { next(err); }
}

async function history(req, res, next) {
  try {
    const { workspace_id } = req.query;
    const ws = workspace_id
      ? await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } })
      : null;
    if (workspace_id && !ws) return res.status(404).json({ message: 'Workspace not found' });

    const runs = await ScanRun.findAll({
      where: workspace_id ? { workspace_id } : {},
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json({ runs });
  } catch (err) { next(err); }
}

async function getStatus(req, res, next) {
  try {
    const run = await ScanRun.findByPk(req.params.id);
    if (!run) return res.status(404).json({ message: 'Scan not found' });
    res.json({ run });
  } catch (err) { next(err); }
}

module.exports = { triggerScan, history, getStatus, persistScanResults };
