'use strict';

const { Workspace } = require('../models');
const { sendDigest, computeNextDigest, buildDigestData } = require('../services/digestEmailService');

async function getSettings(req, res, next) {
  try {
    const ws = await Workspace.findOne({ where: { id: req.query.workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ error: 'Workspace not found' });

    res.json({
      digest_enabled:   ws.digest_enabled   ?? false,
      digest_email:     ws.digest_email     ?? '',
      digest_frequency: ws.digest_frequency ?? 'weekly',
      digest_day:       ws.digest_day       ?? 1,
      digest_hour:      ws.digest_hour      ?? 9,
      digest_next_send: ws.digest_next_send ?? null,
      digest_last_sent: ws.digest_last_sent ?? null,
    });
  } catch (e) { next(e); }
}

async function updateSettings(req, res, next) {
  try {
    const { workspace_id, digest_enabled, digest_email, digest_frequency, digest_day, digest_hour } = req.body;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ error: 'Workspace not found' });

    const freq  = digest_frequency || 'weekly';
    const hour  = Number(digest_hour)  || 9;
    const day   = Number(digest_day)   || 1;
    const nextSend = digest_enabled ? computeNextDigest(freq, hour, day) : null;

    await ws.update({
      digest_enabled:   !!digest_enabled,
      digest_email:     digest_email || null,
      digest_frequency: freq,
      digest_day:       day,
      digest_hour:      hour,
      digest_next_send: nextSend,
    });

    res.json({ ok: true, digest_next_send: nextSend });
  } catch (e) { next(e); }
}

async function sendTest(req, res, next) {
  try {
    const { workspace_id } = req.body;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ error: 'Workspace not found' });
    if (!ws.digest_email) return res.status(400).json({ error: 'No digest email configured' });
    if (!process.env.SMTP_HOST) return res.status(400).json({ error: 'SMTP not configured on server' });

    await sendDigest(ws, null);
    res.json({ ok: true, sent_to: ws.digest_email });
  } catch (e) { next(e); }
}

async function previewData(req, res, next) {
  try {
    const ws = await Workspace.findOne({ where: { id: req.query.workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ error: 'Workspace not found' });
    const data = await buildDigestData(ws, ws.digest_last_sent);
    res.json(data.counts);
  } catch (e) { next(e); }
}

module.exports = { getSettings, updateSettings, sendTest, previewData };
