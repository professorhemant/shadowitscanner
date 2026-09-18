'use strict';

const axios = require('axios');
const { Op } = require('sequelize');
const { Workspace, DiscoveredApp, ApprovalRequest } = require('../models');

// ── Block Kit helpers ────────────────────────────────────────────────────────

function header(text) {
  return { type: 'header', text: { type: 'plain_text', text, emoji: true } };
}
function section(mrkdwn) {
  return { type: 'section', text: { type: 'mrkdwn', text: mrkdwn } };
}
function divider() {
  return { type: 'divider' };
}
function context(text) {
  return { type: 'context', elements: [{ type: 'mrkdwn', text }] };
}

const RISK_EMOJI = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };

// ── Digest builder ───────────────────────────────────────────────────────────

async function buildDigestPayload(ws) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo  = new Date(now.getTime() -     24 * 60 * 60 * 1000);

  // New apps in last 7 days
  const newAppsRaw = await DiscoveredApp.findAll({
    where: { workspace_id: ws.id, first_seen_at: { [Op.gte]: weekAgo } },
    order: [['risk_score', 'DESC']],
  });
  const seen = new Map();
  for (const a of newAppsRaw) {
    if (!seen.has(a.app_id) || seen.get(a.app_id).risk_score < a.risk_score) seen.set(a.app_id, a);
  }
  const newApps = [...seen.values()];

  // Critical in last 24h
  const criticalRaw = await DiscoveredApp.findAll({
    where: { workspace_id: ws.id, risk_level: 'critical', first_seen_at: { [Op.gte]: dayAgo } },
    order: [['risk_score', 'DESC']],
  });
  const seenCrit = new Map();
  for (const a of criticalRaw) {
    if (!seenCrit.has(a.app_id)) seenCrit.set(a.app_id, a);
  }
  const criticalNew = [...seenCrit.values()];

  // Pending whitelist requests
  let pendingApprovals = 0;
  try {
    pendingApprovals = await ApprovalRequest.count({ where: { workspace_id: ws.id, status: 'pending' } });
  } catch { /* table may not exist */ }

  // AI tool count among new apps
  const aiCount = newApps.filter(a => a.is_ai_tool).length;

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const blocks = [
    header(`🛡️ Shadow IT Digest — ${ws.name}`),
    context(`*${dateStr}* · Weekly summary of new app activity`),
    divider(),
  ];

  // New apps section
  if (newApps.length === 0) {
    blocks.push(section('*📋 New Apps (7 days)*\nNo new apps discovered this week. ✅'));
  } else {
    const topApps = newApps.slice(0, 5).map(a =>
      `${RISK_EMOJI[a.risk_level] || '⚪'} *${a.app_name}* (${a.risk_level}) via ${a.source}`
    ).join('\n');
    const more = newApps.length > 5 ? `\n_+${newApps.length - 5} more_` : '';
    blocks.push(section(
      `*📋 New Apps This Week — ${newApps.length} discovered*${aiCount > 0 ? ` · 🤖 ${aiCount} AI tools` : ''}\n${topApps}${more}`
    ));
  }

  blocks.push(divider());

  // Critical alerts
  if (criticalNew.length > 0) {
    const critList = criticalNew.slice(0, 5).map(a =>
      `🔴 *${a.app_name}* — score ${a.risk_score} · ${a.developer || 'Unknown developer'}`
    ).join('\n');
    blocks.push(section(`*🚨 New Critical-Risk Apps (24h)*\n${critList}`));
    blocks.push(divider());
  }

  // Pending approvals
  if (pendingApprovals > 0) {
    blocks.push(section(`*📋 Pending Whitelist Requests*\n${pendingApprovals} request${pendingApprovals !== 1 ? 's' : ''} awaiting IT review.`));
    blocks.push(divider());
  }

  // Summary footer
  const critTotal = newApps.filter(a => a.risk_level === 'critical').length;
  const highTotal = newApps.filter(a => a.risk_level === 'high').length;
  blocks.push(context(
    `*This week:* ${newApps.length} new · 🔴 ${critTotal} critical · 🟠 ${highTotal} high · 🤖 ${aiCount} AI tools` +
    (pendingApprovals > 0 ? ` · 📋 ${pendingApprovals} pending approvals` : '') +
    ` | Shadow IT Scanner`
  ));

  return { blocks };
}

// ── Send helpers ─────────────────────────────────────────────────────────────

async function sendToWebhook(webhookUrl, payload) {
  const res = await axios.post(webhookUrl, payload, { timeout: 8000 });
  if (res.status !== 200 || res.data !== 'ok') {
    throw new Error(`Slack returned: ${res.status} ${res.data}`);
  }
}

async function sendDigest(ws) {
  if (!ws.slack_digest_webhook || !ws.slack_digest_enabled) return;
  const payload = await buildDigestPayload(ws);
  await sendToWebhook(ws.slack_digest_webhook, payload);
  console.log(`[SlackBot] Digest sent for workspace ${ws.id} (${ws.name})`);
}

async function sendTestMessage(webhookUrl, wsName) {
  const blocks = [
    header('🛡️ Shadow IT Scanner — Test Message'),
    section(`Your Slack integration for *${wsName}* is configured correctly! ✅\nYou'll receive daily digests with new app discoveries, critical risk alerts, and pending approval requests.`),
    context('This is a test message sent from Shadow IT Scanner.'),
  ];
  await sendToWebhook(webhookUrl, { blocks });
}

async function sendCriticalAlert(ws, app) {
  if (!ws.slack_digest_webhook || !ws.slack_digest_enabled) return;
  const blocks = [
    header('🚨 Critical Risk App Detected'),
    section(`*${app.app_name}* was just discovered in *${ws.name}* with a critical risk score.\n\n*Risk score:* ${app.risk_score}\n*Developer:* ${app.developer || 'Unknown'}\n*Source:* ${app.source}${app.is_ai_tool ? '\n*Category:* 🤖 AI Tool' : ''}`),
    divider(),
    context('Shadow IT Scanner · Review this app in your dashboard'),
  ];
  await sendToWebhook(ws.slack_digest_webhook, { blocks });
}

// ── Hourly cron runner ───────────────────────────────────────────────────────

async function runDigestCron() {
  const hour = new Date().getUTCHours();
  try {
    const workspaces = await Workspace.findAll({
      where: { slack_digest_enabled: true },
    });
    for (const ws of workspaces) {
      if (ws.slack_digest_hour === hour) {
        sendDigest(ws).catch(e => console.error(`[SlackBot] Digest failed for ${ws.id}:`, e.message));
      }
    }
  } catch (e) {
    console.error('[SlackBot] Cron runner error:', e.message);
  }
}

module.exports = { sendDigest, sendTestMessage, sendCriticalAlert, runDigestCron, buildDigestPayload };
