'use strict';

const { Workspace, ApprovalRequest, AlertConfig } = require('../models');
const { sendApprovalRequestEmail, sendApprovalDecisionEmail } = require('../services/emailService');

// Public — employee submits a request (no auth required, workspace_id in body)
async function submit(req, res, next) {
  try {
    const { workspace_id, app_name, app_url, app_description, requester_name, requester_email, business_justification } = req.body;
    if (!workspace_id || !app_name || !requester_name || !requester_email) {
      return res.status(400).json({ message: 'workspace_id, app_name, requester_name and requester_email are required' });
    }

    const ws = await Workspace.findByPk(workspace_id);
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const request = await ApprovalRequest.create({
      workspace_id,
      app_name: app_name.trim(),
      app_url: app_url?.trim() || null,
      app_description: app_description?.trim() || null,
      requester_name: requester_name.trim(),
      requester_email: requester_email.trim().toLowerCase(),
      business_justification: business_justification?.trim() || null,
      status: 'pending',
    });

    // Notify IT team
    const alertCfg = await AlertConfig.findOne({ where: { workspace_id } });
    if (alertCfg?.email_recipients?.length) {
      await sendApprovalRequestEmail({
        itRecipients: alertCfg.email_recipients,
        workspaceName: ws.name,
        request,
        dashboardUrl: process.env.FRONTEND_URL,
      }).catch(() => {});
    }

    res.status(201).json({ request, message: 'Request submitted successfully' });
  } catch (err) { next(err); }
}

// Authenticated — IT lists all requests for a workspace
async function list(req, res, next) {
  try {
    const { workspace_id, status } = req.query;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const where = { workspace_id };
    if (status) where.status = status;

    const requests = await ApprovalRequest.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 200,
    });

    const counts = {
      pending: await ApprovalRequest.count({ where: { workspace_id, status: 'pending' } }),
      approved: await ApprovalRequest.count({ where: { workspace_id, status: 'approved' } }),
      rejected: await ApprovalRequest.count({ where: { workspace_id, status: 'rejected' } }),
    };

    res.json({ requests, counts });
  } catch (err) { next(err); }
}

// Authenticated — IT approves or rejects a request
async function review(req, res, next) {
  try {
    const { status, review_reason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved or rejected' });
    }

    const request = await ApprovalRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Verify the workspace belongs to this user
    const ws = await Workspace.findOne({ where: { id: request.workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(403).json({ message: 'Forbidden' });

    await request.update({
      status,
      review_reason: review_reason?.trim() || null,
      reviewed_by: req.user.name || req.user.email,
      reviewed_at: new Date(),
    });

    // Notify the requester
    await sendApprovalDecisionEmail({ request, workspaceName: ws.name }).catch(() => {});

    res.json({ request, message: `Request ${status}` });
  } catch (err) { next(err); }
}

// Public — get workspace info for the employee form (name only, no sensitive data)
async function workspaceInfo(req, res, next) {
  try {
    const ws = await Workspace.findByPk(req.params.workspaceId, {
      attributes: ['id', 'name'],
    });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });
    res.json({ workspace: { id: ws.id, name: ws.name } });
  } catch (err) { next(err); }
}

module.exports = { submit, list, review, workspaceInfo };
