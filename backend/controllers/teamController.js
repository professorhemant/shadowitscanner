'use strict';

const crypto = require('crypto');
const { Workspace, TeamMember, User } = require('../models');
const nodemailer = require('nodemailer');

const VALID_ROLES = ['admin', 'viewer'];

function sendInviteEmail(to, inviterName, workspaceName, acceptUrl) {
  if (!process.env.SMTP_HOST) return;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  transport.sendMail({
    from: process.env.ALERT_FROM_EMAIL || 'noreply@shadowit.app',
    to,
    subject: `${inviterName} invited you to Shadow IT Scanner — ${workspaceName}`,
    html: `
<div style="max-width:480px;margin:32px auto;background:#1e293b;border-radius:12px;border:1px solid #334155;font-family:sans-serif;overflow:hidden;">
  <div style="background:#0f172a;padding:20px 24px;border-bottom:1px solid #334155;">
    <span style="color:#e2e8f0;font-weight:700;font-size:16px;">🛡️ Shadow IT Scanner</span>
  </div>
  <div style="padding:24px;">
    <h2 style="color:#f1f5f9;font-size:18px;margin:0 0 12px;">You've been invited</h2>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">
      <strong style="color:#e2e8f0;">${inviterName}</strong> has invited you to collaborate on
      <strong style="color:#e2e8f0;">${workspaceName}</strong>.
    </p>
    <div style="text-align:center;">
      <a href="${acceptUrl}" style="display:inline-block;background:#6366f1;color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Accept Invitation →
      </a>
    </div>
    <p style="font-size:11px;color:#475569;text-align:center;margin-top:16px;">
      If you don't have an account, register with this email address first.
    </p>
  </div>
</div>`,
  }).catch(() => {});
}

async function invite(req, res, next) {
  try {
    const { workspace_id, email, role } = req.body;
    if (!workspace_id || !email || !role) return res.status(400).json({ message: 'workspace_id, email, and role required' });
    if (!VALID_ROLES.includes(role)) return res.status(400).json({ message: 'role must be admin or viewer' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    if (email.toLowerCase() === req.user.email.toLowerCase()) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }

    const invite_token = crypto.randomBytes(32).toString('hex');

    const [member, created] = await TeamMember.findOrCreate({
      where: { workspace_id, email: email.toLowerCase() },
      defaults: {
        inviter_id: req.user.id,
        role,
        status: 'pending',
        invite_token,
        invited_at: new Date(),
      },
    });

    if (!created) {
      if (member.status === 'active') return res.status(409).json({ message: 'User is already a team member' });
      // Re-invite (reset token)
      await member.update({ role, status: 'pending', invite_token, invited_at: new Date() });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://shadowit.app';
    const acceptUrl = `${frontendUrl}/invite/accept?token=${invite_token}`;
    sendInviteEmail(email.toLowerCase(), req.user.name, ws.name, acceptUrl);

    res.json({ message: 'Invitation sent', invite_token, accept_url: acceptUrl });
  } catch (err) { next(err); }
}

async function listMembers(req, res, next) {
  try {
    const { workspace_id } = req.params;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const owner = await User.findByPk(ws.user_id, { attributes: ['id', 'name', 'email'] });

    const members = await TeamMember.findAll({
      where: { workspace_id },
      order: [['invited_at', 'ASC']],
      attributes: ['id', 'email', 'role', 'status', 'invited_at', 'accepted_at'],
    });

    res.json({
      owner: { id: owner.id, name: owner.name, email: owner.email, role: 'owner' },
      members: members.map(m => ({
        id: m.id,
        email: m.email,
        role: m.role,
        status: m.status,
        invited_at: m.invited_at,
        accepted_at: m.accepted_at,
      })),
    });
  } catch (err) { next(err); }
}

async function revoke(req, res, next) {
  try {
    const member = await TeamMember.findByPk(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    const ws = await Workspace.findOne({ where: { id: member.workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(403).json({ message: 'Forbidden' });

    await member.update({ status: 'revoked' });
    res.json({ message: 'Access revoked' });
  } catch (err) { next(err); }
}

async function listInvites(req, res, next) {
  try {
    const email = req.user.email.toLowerCase();
    const invites = await TeamMember.findAll({
      where: { email, status: 'pending' },
      order: [['invited_at', 'DESC']],
      attributes: ['id', 'workspace_id', 'role', 'invited_at'],
    });

    const result = await Promise.all(invites.map(async inv => {
      const ws = await Workspace.findByPk(inv.workspace_id, { attributes: ['id', 'name', 'type'] });
      const inviter = await User.findByPk(
        (await TeamMember.findByPk(inv.id, { attributes: ['inviter_id'] }))?.inviter_id,
        { attributes: ['name'] }
      ).catch(() => null);
      return ws ? {
        id: inv.id,
        workspace_id: ws.id,
        workspace_name: ws.name,
        workspace_type: ws.type,
        role: inv.role,
        invited_at: inv.invited_at,
        invited_by: inviter?.name || 'Unknown',
      } : null;
    }));

    res.json({ invites: result.filter(Boolean) });
  } catch (err) { next(err); }
}

async function acceptInvite(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token required' });

    const member = await TeamMember.findOne({ where: { invite_token: token, status: 'pending' } });
    if (!member) return res.status(404).json({ message: 'Invite not found or already used' });

    if (member.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: 'This invite was sent to a different email address' });
    }

    await member.update({
      user_id: req.user.id,
      status: 'active',
      accepted_at: new Date(),
      invite_token: null,
    });

    const ws = await Workspace.findByPk(member.workspace_id, { attributes: ['name', 'type'] });
    res.json({ message: `Joined ${ws?.name || 'workspace'} as ${member.role}`, workspace_id: member.workspace_id });
  } catch (err) { next(err); }
}

module.exports = { invite, listMembers, revoke, listInvites, acceptInvite };
