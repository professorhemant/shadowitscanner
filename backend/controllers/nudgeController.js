'use strict';

const { Workspace, DiscoveredApp, AlertConfig, NudgeLog } = require('../models');
const { sendNudgeEmail } = require('../services/emailService');

async function list(req, res, next) {
  try {
    const { workspace_id } = req.query;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const logs = await NudgeLog.findAll({
      where: { workspace_id },
      order: [['sent_at', 'DESC']],
      limit: 100,
    });
    res.json({ logs });
  } catch (err) { next(err); }
}

async function send(req, res, next) {
  try {
    const { workspace_id, app_id, recipients } = req.body;
    if (!workspace_id || !app_id) return res.status(400).json({ message: 'workspace_id and app_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const app = await DiscoveredApp.findOne({
      where: { workspace_id, app_id },
      order: [['last_seen_at', 'DESC']],
    });
    if (!app) return res.status(404).json({ message: 'App not found' });

    let rcpts = recipients?.length ? recipients : [];
    if (!rcpts.length) {
      const alertCfg = await AlertConfig.findOne({ where: { workspace_id } });
      rcpts = alertCfg?.email_recipients || [];
    }

    await sendNudgeEmail({ recipients: rcpts, workspaceName: ws.name, app });

    const log = await NudgeLog.create({
      workspace_id,
      app_id: app.app_id,
      app_name: app.app_name,
      source: app.source,
      risk_level: app.risk_level,
      risk_score: app.risk_score,
      user_count: app.user_count,
      recipients: rcpts,
      nudge_type: 'manual',
    });

    res.json({ log, message: rcpts.length ? 'Nudge sent' : 'Nudge logged (no recipients configured)' });
  } catch (err) { next(err); }
}

module.exports = { list, send };
