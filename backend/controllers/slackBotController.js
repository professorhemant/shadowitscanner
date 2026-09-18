'use strict';

const { Workspace } = require('../models');
const { sendTestMessage, sendDigest } = require('../services/slackBotService');
const { encrypt, decrypt } = require('../utils/crypto');

async function getConfig(req, res, next) {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    res.json({
      slack_digest_enabled: ws.slack_digest_enabled || false,
      slack_digest_hour: ws.slack_digest_hour ?? 9,
      slack_digest_channel: ws.slack_digest_channel || '',
      has_webhook: !!(ws.slack_digest_webhook),
    });
  } catch (err) { next(err); }
}

async function configure(req, res, next) {
  try {
    const { workspace_id, webhook_url, channel, enabled, digest_hour } = req.body;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const updates = {};
    if (webhook_url !== undefined) updates.slack_digest_webhook = webhook_url || null;
    if (channel !== undefined) updates.slack_digest_channel = channel || null;
    if (enabled !== undefined) updates.slack_digest_enabled = !!enabled;
    if (digest_hour !== undefined) updates.slack_digest_hour = Math.max(0, Math.min(23, parseInt(digest_hour) || 9));

    await ws.update(updates);
    res.json({ message: 'Slack bot configured' });
  } catch (err) { next(err); }
}

async function testWebhook(req, res, next) {
  try {
    const { workspace_id } = req.body;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });
    if (!ws.slack_digest_webhook) return res.status(400).json({ message: 'No webhook URL configured' });

    await sendTestMessage(ws.slack_digest_webhook, ws.name);
    res.json({ message: 'Test message sent to Slack' });
  } catch (err) {
    if (err.response) return res.status(400).json({ message: `Slack rejected the message: ${err.response.data}` });
    next(err);
  }
}

async function sendNow(req, res, next) {
  try {
    const { workspace_id } = req.body;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });
    if (!ws.slack_digest_webhook) return res.status(400).json({ message: 'No webhook URL configured' });

    await sendDigest(ws);
    res.json({ message: 'Digest sent to Slack' });
  } catch (err) {
    if (err.response) return res.status(400).json({ message: `Slack rejected the message: ${err.response.data}` });
    next(err);
  }
}

module.exports = { getConfig, configure, testWebhook, sendNow };
