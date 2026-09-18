'use strict';

const { Workspace } = require('../models');

async function list(req, res, next) {
  try {
    const workspaces = await Workspace.findAll({
      where: { user_id: req.user.id },
      attributes: { exclude: ['slack_bot_token', 'slack_user_token', 'google_service_account'] },
    });
    res.json({ workspaces });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, type, slack_team_id, slack_bot_token, slack_user_token,
            google_domain, google_service_account, google_admin_email,
            ms_tenant_id, ms_client_id, ms_client_secret,
            okta_domain, okta_api_token, schedule } = req.body;

    const workspace = await Workspace.create({
      user_id: req.user.id, name, type,
      slack_team_id, slack_bot_token, slack_user_token,
      google_domain, google_service_account, google_admin_email,
      ms_tenant_id, ms_client_id, ms_client_secret,
      okta_domain, okta_api_token, schedule,
    });

    res.status(201).json({
      workspace: {
        id: workspace.id, name: workspace.name, type: workspace.type,
        is_active: workspace.is_active, google_domain: workspace.google_domain,
        slack_team_id: workspace.slack_team_id, last_scan_at: workspace.last_scan_at,
      },
    });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const ws = await Workspace.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });
    const allowed = ['name', 'slack_bot_token', 'slack_user_token', 'google_domain',
                     'google_service_account', 'google_admin_email',
                     'ms_tenant_id', 'ms_client_id', 'ms_client_secret',
                     'okta_domain', 'okta_api_token',
                     'schedule', 'is_active'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) ws[key] = req.body[key];
    }
    await ws.save();
    res.json({ message: 'Updated' });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const ws = await Workspace.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });
    await ws.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
