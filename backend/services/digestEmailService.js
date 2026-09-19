'use strict';

const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const RISK_COLOR  = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#22c55e' };
const RISK_BG     = { critical: '#450a0a', high: '#431407', medium: '#172554', low: '#052e16' };
const RISK_BORDER = { critical: '#7f1d1d', high: '#7c2d12', medium: '#1e3a5f', low: '#14532d' };

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { dateStyle: 'long' });
}

async function buildDigestData(ws, since) {
  const { DiscoveredApp, WhitelistedApp } = require('../models');

  // Latest snapshot per app_id
  const [allApps] = await sequelize.query(
    `SELECT DISTINCT ON (app_id) app_id, app_name, developer, source, risk_level, risk_score, user_count, is_ai_tool, created_at
     FROM discovered_apps WHERE workspace_id = :wsId
     ORDER BY app_id, created_at DESC`,
    { replacements: { wsId: ws.id }, type: require('sequelize').QueryTypes.SELECT }
  ).catch(() => [[]]);

  const apps = Array.isArray(allApps[0]) ? allApps[0] : allApps;

  const counts = { critical: 0, high: 0, medium: 0, low: 0, total: apps.length };
  apps.forEach(a => { if (counts[a.risk_level] !== undefined) counts[a.risk_level]++; });

  // Whitelisted app_ids
  const wlRows = await WhitelistedApp.findAll({ where: { workspace_id: ws.id }, attributes: ['app_id', 'source', 'approved_at'] });
  const wlSet = new Set(wlRows.map(w => `${w.app_id}:${w.source}`));

  // New apps since last digest
  const newApps = since ? apps.filter(a => new Date(a.created_at) >= new Date(since)) : [];

  // Top unapproved critical/high
  const unapproved = apps
    .filter(a => ['critical', 'high'].includes(a.risk_level) && !wlSet.has(`${a.app_id}:${a.source}`))
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 7);

  // Recently approved
  const recentApproved = wlRows
    .filter(w => since && new Date(w.approved_at) >= new Date(since))
    .slice(0, 5);

  return { apps, counts, unapproved, newApps, recentApproved };
}

function buildDigestHtml(ws, data, since) {
  const { counts, unapproved, newApps, recentApproved } = data;
  const dashUrl = process.env.FRONTEND_URL || 'https://shadowit.app';
  const fromDate = since ? fmtDate(since) : 'all time';
  const toDate = fmtDate(new Date());

  const statCells = [
    { label: 'Total Apps',     value: counts.total,    color: '#e2e8f0' },
    { label: 'Critical',       value: counts.critical, color: RISK_COLOR.critical },
    { label: 'High',           value: counts.high,     color: RISK_COLOR.high },
    { label: 'New This Period',value: newApps.length,  color: '#6366f1' },
  ].map(s => `
    <td style="text-align:center;padding:16px 12px;border-right:1px solid #1e293b;">
      <div style="font-size:28px;font-weight:800;color:${s.color};">${s.value}</div>
      <div style="font-size:11px;color:#64748b;margin-top:3px;text-transform:uppercase;letter-spacing:0.05em;">${s.label}</div>
    </td>`).join('');

  const appRows = unapproved.length === 0
    ? `<tr><td colspan="4" style="padding:20px;text-align:center;color:#64748b;font-size:13px;">No unapproved critical/high apps — great work! ✅</td></tr>`
    : unapproved.map(a => `
    <tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:10px 12px;">
        <div style="font-weight:600;font-size:13px;color:#f1f5f9;">${a.app_name}${a.is_ai_tool ? ' <span style="font-size:10px;background:#4c1d95;color:#c4b5fd;padding:1px 6px;border-radius:4px;margin-left:4px;">AI</span>' : ''}</div>
        <div style="font-size:11px;color:#64748b;margin-top:1px;text-transform:capitalize;">${a.source} · ${a.developer || 'Unknown'}</div>
      </td>
      <td style="padding:10px 12px;text-align:center;">
        <span style="display:inline-block;background:${RISK_BG[a.risk_level]};border:1px solid ${RISK_BORDER[a.risk_level]};color:${RISK_COLOR[a.risk_level]};font-size:10px;font-weight:700;text-transform:uppercase;padding:3px 8px;border-radius:12px;">${a.risk_level}</span>
      </td>
      <td style="padding:10px 12px;text-align:center;font-size:16px;font-weight:800;color:${RISK_COLOR[a.risk_level]};">${a.risk_score}</td>
      <td style="padding:10px 12px;text-align:center;font-size:13px;color:#94a3b8;">${a.user_count}</td>
    </tr>`).join('');

  const approvedSection = recentApproved.length > 0 ? `
    <div style="margin-top:24px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:12px;">✅ Approved This Period (${recentApproved.length})</div>
      <div style="color:#94a3b8;font-size:13px;">${recentApproved.map(w => w.app_id).join(', ')}</div>
    </div>` : '';

  const critBanner = counts.critical > 0 ? `
    <div style="background:#450a0a;border:1px solid #7f1d1d;border-radius:8px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:22px;">🔴</span>
      <div>
        <div style="font-weight:700;color:#fca5a5;font-size:14px;">${counts.critical} critical app${counts.critical !== 1 ? 's' : ''} require immediate attention</div>
        <div style="font-size:12px;color:#f87171;margin-top:2px;">Review and approve or revoke access in the dashboard.</div>
      </div>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;">

  <!-- Header -->
  <div style="background:#0f172a;padding:20px 28px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-size:22px;">🛡️</span>
      <span style="color:#e2e8f0;font-weight:700;font-size:16px;">Shadow IT Scanner</span>
    </div>
    <div style="font-size:11px;color:#475569;text-align:right;">
      <div style="color:#94a3b8;font-weight:600;">${ws.name}</div>
      <div>${fromDate} – ${toDate}</div>
    </div>
  </div>

  <!-- Title -->
  <div style="padding:24px 28px 0;">
    <h1 style="margin:0 0 4px;font-size:20px;color:#f1f5f9;">Weekly Security Digest</h1>
    <p style="margin:0;font-size:13px;color:#64748b;">Your Shadow IT summary for <strong style="color:#94a3b8;">${ws.name}</strong></p>
  </div>

  <!-- Stats bar -->
  <div style="margin:20px 28px 0;background:#0f172a;border:1px solid #1e293b;border-radius:10px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;"><tr>${statCells}</tr></table>
  </div>

  <!-- Body -->
  <div style="padding:24px 28px;">
    ${critBanner}

    <!-- Unapproved risky apps -->
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:10px;">
      ⚠ Unapproved Critical &amp; High Risk Apps
    </div>
    <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#0d1424;border-bottom:1px solid #1e293b;">
            <th style="padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;color:#475569;letter-spacing:0.05em;">App</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;text-transform:uppercase;color:#475569;letter-spacing:0.05em;">Risk</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;text-transform:uppercase;color:#475569;letter-spacing:0.05em;">Score</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;text-transform:uppercase;color:#475569;letter-spacing:0.05em;">Users</th>
          </tr>
        </thead>
        <tbody>${appRows}</tbody>
      </table>
    </div>

    ${approvedSection}

    <!-- CTA -->
    <div style="margin-top:28px;text-align:center;">
      <a href="${dashUrl}/apps" style="display:inline-block;background:#6366f1;color:#fff;font-weight:600;font-size:14px;padding:13px 32px;border-radius:9px;text-decoration:none;">
        Review in Dashboard →
      </a>
    </div>

    <p style="font-size:11px;color:#334155;text-align:center;margin-top:20px;">
      You're receiving this because email digest is enabled for <strong>${ws.name}</strong>.<br>
      Manage settings in <a href="${dashUrl}/digest" style="color:#475569;">Dashboard → Email Digest</a>.
    </p>
  </div>
</div>
</body></html>`;
}

async function sendDigest(ws, since) {
  if (!process.env.SMTP_HOST || !ws.digest_email) return;
  const data = await buildDigestData(ws, since);
  const html = buildDigestHtml(ws, data, since);
  const transport = getTransport();

  const { counts } = data;
  const subject = counts.critical > 0
    ? `🔴 Shadow IT Digest — ${counts.critical} Critical App${counts.critical !== 1 ? 's' : ''} Need Attention (${ws.name})`
    : counts.high > 0
    ? `🟠 Shadow IT Digest — Weekly Summary for ${ws.name}`
    : `✅ Shadow IT Digest — All Clear for ${ws.name}`;

  await transport.sendMail({
    from: process.env.ALERT_FROM_EMAIL || 'noreply@shadowit.app',
    to: ws.digest_email,
    subject,
    html,
  });

  console.log(`[EmailDigest] Sent to ${ws.digest_email} for workspace ${ws.id}`);
}

function computeNextDigest(frequency, hour, day) {
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

async function runScheduledDigests() {
  const { Workspace } = require('../models');
  const { Op } = require('sequelize');
  const now = new Date();

  const workspaces = await Workspace.findAll({
    where: {
      digest_enabled: true,
      digest_email: { [Op.ne]: null },
      digest_next_send: { [Op.lte]: now },
    },
  });

  if (workspaces.length) {
    console.log(`[EmailDigest] Sending ${workspaces.length} digest(s)`);
  }

  for (const ws of workspaces) {
    const since = ws.digest_last_sent;
    // Advance next_send immediately
    const nextSend = computeNextDigest(ws.digest_frequency || 'weekly', ws.digest_hour || 9, ws.digest_day || 1);
    await ws.update({ digest_next_send: nextSend, digest_last_sent: now });
    sendDigest(ws, since).catch(e => console.error(`[EmailDigest] Error for ws ${ws.id}:`, e.message));
  }
}

module.exports = { sendDigest, computeNextDigest, runScheduledDigests, buildDigestData };
