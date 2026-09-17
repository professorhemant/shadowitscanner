'use strict';

const { AlertConfig, Workspace } = require('../models');

async function getConfig(req, res, next) {
  try {
    const { workspace_id } = req.params;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    let cfg = await AlertConfig.findOne({ where: { workspace_id } });
    if (!cfg) cfg = await AlertConfig.create({ workspace_id, email_recipients: [] });
    res.json({ config: cfg });
  } catch (err) { next(err); }
}

async function updateConfig(req, res, next) {
  try {
    const { workspace_id } = req.params;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const allowed = ['enabled', 'min_risk_level', 'email_recipients', 'notify_on_new', 'notify_on_score_change'];
    const [cfg, created] = await AlertConfig.findOrCreate({
      where: { workspace_id },
      defaults: { workspace_id, email_recipients: [] },
    });
    for (const key of allowed) {
      if (req.body[key] !== undefined) cfg[key] = req.body[key];
    }
    await cfg.save();
    res.json({ config: cfg });
  } catch (err) { next(err); }
}

module.exports = { getConfig, updateConfig };
