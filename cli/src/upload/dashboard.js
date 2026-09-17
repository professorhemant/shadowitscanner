'use strict';

const axios = require('axios');
const { get } = require('../utils/config');

const DASHBOARD_URL = process.env.SHADOW_AUDIT_API || 'https://shadowit.app/api';

async function uploadToDashboard(results) {
  const token = get('api_token');
  if (!token) {
    return { success: false, reason: 'No API token configured. Run: shadow-audit auth --token <API_KEY>' };
  }

  try {
    const res = await axios.post(
      `${DASHBOARD_URL}/cli/upload`,
      { results, cli_version: require('../../package.json').version },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    return { success: true, scan_id: res.data.scan_id, url: res.data.url };
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    return { success: false, reason: msg };
  }
}

module.exports = { uploadToDashboard };
