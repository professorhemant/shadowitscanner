'use strict';

const { Workspace, ScanRun, DiscoveredApp, WhitelistedApp, AlertConfig } = require('../models');
const { scanSlack } = require('../services/slackScanner');
const { scanGoogle } = require('../services/googleScanner');
const { sendAlertEmail } = require('../services/emailService');

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
      first_seen_at: a.first_seen_at || new Date(),
      last_seen_at: a.last_seen_at || new Date(),
    })),
    { ignoreDuplicates: true }
  );

  await Workspace.update({ last_scan_at: new Date() }, { where: { id: workspaceId } });
  return run;
}

async function triggerScan(req, res, next) {
  try {
    const { workspace_id, source } = req.body;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const run = await ScanRun.create({
      workspace_id, triggered_by: 'manual',
      source: source || ws.type, status: 'running', started_at: new Date(),
    });

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
