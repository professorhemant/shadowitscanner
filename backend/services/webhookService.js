'use strict';

const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { WebhookConfig, WebhookDelivery, Workspace } = require('../models');

const ALL_EVENTS = ['app.critical', 'app.high', 'app.discovered', 'scan.completed', 'app.whitelisted'];

function buildPayload(event, workspaceId, workspaceName, data) {
  return {
    id: uuidv4(),
    event,
    workspace_id: workspaceId,
    workspace_name: workspaceName,
    timestamp: new Date().toISOString(),
    data,
  };
}

function signPayload(secret, body) {
  if (!secret) return null;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  return `sha256=${hmac.digest('hex')}`;
}

async function deliver(config, event, payload) {
  const body = JSON.stringify(payload);
  const signature = signPayload(config.secret, body);
  const deliveryId = uuidv4();
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'ShadowITScanner-Webhooks/1.0',
    'X-Shadow-Event': event,
    'X-Shadow-Delivery': deliveryId,
  };
  if (signature) headers['X-Shadow-Signature'] = signature;

  const start = Date.now();
  let delivery;
  try {
    delivery = await WebhookDelivery.create({
      webhook_config_id: config.id,
      event_type: event,
      payload,
      status: 'pending',
    });

    const res = await axios.post(config.url, body, { headers, timeout: 10000, validateStatus: () => true });
    const duration_ms = Date.now() - start;
    const responseBody = String(res.data || '').slice(0, 500);

    const status = res.status >= 200 && res.status < 300 ? 'success' : 'failed';
    await delivery.update({ status, response_code: res.status, response_body: responseBody, duration_ms });
    return { success: status === 'success', status: res.status };
  } catch (err) {
    const duration_ms = Date.now() - start;
    const errMsg = err.message;
    if (delivery) {
      await delivery.update({ status: 'failed', error_message: errMsg, duration_ms });
    } else {
      await WebhookDelivery.create({
        webhook_config_id: config.id,
        event_type: event,
        payload,
        status: 'failed',
        error_message: errMsg,
        duration_ms,
      });
    }
    return { success: false, error: errMsg };
  }
}

async function fireEvent(workspaceId, event, data) {
  try {
    const configs = await WebhookConfig.findAll({ where: { workspace_id: workspaceId, enabled: true } });
    const ws = await Workspace.findByPk(workspaceId, { attributes: ['id', 'name'] });
    const wsName = ws?.name || workspaceId;

    for (const cfg of configs) {
      const events = Array.isArray(cfg.events) ? cfg.events : [];
      if (!events.includes(event)) continue;
      const payload = buildPayload(event, workspaceId, wsName, data);
      deliver(cfg, event, payload).catch(e => console.error(`[Webhook] Delivery failed for ${cfg.id}:`, e.message));
    }
  } catch (e) {
    console.error('[Webhook] fireEvent error:', e.message);
  }
}

async function fireForApps(workspaceId, apps, scanRunId) {
  if (!apps?.length) return;

  // Fire app.critical and app.high for newly discovered apps
  for (const app of apps) {
    if (app.risk_level === 'critical') {
      await fireEvent(workspaceId, 'app.critical', {
        scan_run_id: scanRunId,
        app_id: app.app_id,
        app_name: app.app_name,
        developer: app.developer,
        source: app.source,
        risk_score: app.risk_score,
        risk_level: app.risk_level,
        is_ai_tool: app.is_ai_tool,
        scopes: app.scopes,
      });
    } else if (app.risk_level === 'high') {
      await fireEvent(workspaceId, 'app.high', {
        scan_run_id: scanRunId,
        app_id: app.app_id,
        app_name: app.app_name,
        developer: app.developer,
        source: app.source,
        risk_score: app.risk_score,
        risk_level: app.risk_level,
        is_ai_tool: app.is_ai_tool,
        scopes: app.scopes,
      });
    }
    // fire app.discovered for every app
    await fireEvent(workspaceId, 'app.discovered', {
      scan_run_id: scanRunId,
      app_id: app.app_id,
      app_name: app.app_name,
      risk_level: app.risk_level,
      risk_score: app.risk_score,
      source: app.source,
    });
  }
}

async function fireTestPing(config, workspaceName) {
  const payload = buildPayload('ping', config.workspace_id, workspaceName, {
    message: 'This is a test delivery from Shadow IT Scanner.',
    webhook_name: config.name,
  });
  return deliver(config, 'ping', payload);
}

module.exports = { fireEvent, fireForApps, fireTestPing, ALL_EVENTS };
