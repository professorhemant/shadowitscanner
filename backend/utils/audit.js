'use strict';

async function logAction(req, workspace_id, action, resource_type, resource_id, resource_name, meta = {}) {
  try {
    const { AuditLog } = require('../models');
    await AuditLog.create({
      workspace_id,
      user_id: req?.user?.id || null,
      actor_name: req?.user?.name || null,
      actor_email: req?.user?.email || null,
      action,
      resource_type,
      resource_id: resource_id ? String(resource_id) : null,
      resource_name: resource_name ? String(resource_name) : null,
      meta,
      ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || null,
    });
  } catch {
    // audit logging must never crash the main request
  }
}

module.exports = { logAction };
