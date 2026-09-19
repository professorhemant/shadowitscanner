'use strict';

require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const { syncDB } = require('./models');
const { runDigestCron } = require('./services/slackBotService');
const { runScheduledScans } = require('./services/scanScheduleService');
const { runScheduledDigests } = require('./services/digestEmailService');

const PORT = process.env.PORT || 5000;

syncDB().then(() => {
  app.listen(PORT, () => console.log(`Shadow IT backend running on port ${PORT}`));

  // Slack digest: fires at the top of every hour
  cron.schedule('0 * * * *', () => {
    runDigestCron().catch(e => console.error('[SlackBot cron]', e.message));
  });

  // Auto-scan scheduler: checks for due scans every hour
  cron.schedule('5 * * * *', () => {
    runScheduledScans().catch(e => console.error('[AutoScan cron]', e.message));
  });

  // Email digest scheduler: checks for due digests every hour
  cron.schedule('10 * * * *', () => {
    runScheduledDigests().catch(e => console.error('[EmailDigest cron]', e.message));
  });

  console.log('Crons scheduled: Slack digest + auto-scan + email digest (hourly)');
}).catch(err => {
  console.error('DB sync failed:', err);
  process.exit(1);
});
