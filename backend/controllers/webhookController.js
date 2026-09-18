'use strict';

const { Workspace, WebhookConfig, WebhookDelivery } = require('../models');
const { fireTestPing, ALL_EVENTS } = require('../services/webhookService');
const crypto = require('crypto');

async function list(req, res, next) {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const configs = await WebhookConfig.findAll({
      where: { workspace_id },
      order: [['created_at', 'DESC']],
    });

    // For each config, get delivery stats
    const result = await Promise.all(configs.map(async c => {
      const total = await WebhookDelivery.count({ where: { webhook_config_id: c.id } });
      const success = await WebhookDelivery.count({ where: { webhook_config_id: c.id, status: 'success' } });
      const last = await WebhookDelivery.findOne({ where: { webhook_config_id: c.id }, order: [['created_at', 'DESC']] });
      return {
        id: c.id,
        name: c.name,
        url: maskUrl(c.url),
        events: c.events,
        enabled: c.enabled,
        created_at: c.created_at,
        stats: { total, success, failed: total - success },
        last_delivery: last ? { status: last.status, created_at: last.created_at } : null,
      };
    }));

    res.json({ webhooks: result, all_events: ALL_EVENTS });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { workspace_id, name, url, events, enabled } = req.body;
    if (!workspace_id || !name || !url) return res.status(400).json({ message: 'workspace_id, name, and url required' });
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    // Auto-generate a secret if not provided
    const secret = crypto.randomBytes(32).toString('hex');

    const cfg = await WebhookConfig.create({
      workspace_id,
      name: name.trim(),
      url: url.trim(),
      secret,
      events: Array.isArray(events) ? events : ['app.critical', 'app.high'],
      enabled: enabled !== false,
    });

    res.json({ id: cfg.id, secret, message: 'Webhook created. Save the secret — it will not be shown again.' });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { name, url, events, enabled } = req.body;
    const cfg = await findOwned(req.params.id, req.user.id);
    if (!cfg) return res.status(404).json({ message: 'Webhook not found' });

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (url !== undefined) updates.url = url;
    if (events !== undefined) updates.events = events;
    if (enabled !== undefined) updates.enabled = !!enabled;
    await cfg.update(updates);
    res.json({ message: 'Webhook updated' });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const cfg = await findOwned(req.params.id, req.user.id);
    if (!cfg) return res.status(404).json({ message: 'Webhook not found' });
    await cfg.destroy();
    res.json({ message: 'Webhook deleted' });
  } catch (err) { next(err); }
}

async function test(req, res, next) {
  try {
    const cfg = await findOwned(req.params.id, req.user.id);
    if (!cfg) return res.status(404).json({ message: 'Webhook not found' });
    const ws = await Workspace.findByPk(cfg.workspace_id, { attributes: ['name'] });
    const result = await fireTestPing(cfg, ws?.name || '');
    if (result.success) {
      res.json({ message: 'Test ping delivered successfully', status: result.status });
    } else {
      res.status(400).json({ message: `Delivery failed: ${result.error || `HTTP ${result.status}`}` });
    }
  } catch (err) { next(err); }
}

async function deliveries(req, res, next) {
  try {
    const cfg = await findOwned(req.params.id, req.user.id);
    if (!cfg) return res.status(404).json({ message: 'Webhook not found' });

    const rows = await WebhookDelivery.findAll({
      where: { webhook_config_id: cfg.id },
      order: [['created_at', 'DESC']],
      limit: 50,
      attributes: ['id', 'event_type', 'status', 'response_code', 'response_body', 'duration_ms', 'error_message', 'created_at'],
    });
    res.json({ deliveries: rows });
  } catch (err) { next(err); }
}

async function findOwned(webhookId, userId) {
  const cfg = await WebhookConfig.findByPk(webhookId);
  if (!cfg) return null;
  const ws = await Workspace.findOne({ where: { id: cfg.workspace_id, user_id: userId } });
  return ws ? cfg : null;
}

function maskUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}/***`;
  } catch { return url.slice(0, 40) + '***'; }
}

module.exports = { list, create, update, remove, test, deliveries };
