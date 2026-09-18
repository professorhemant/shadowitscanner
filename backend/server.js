'use strict';

require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const { syncDB } = require('./models');
const { runDigestCron } = require('./services/slackBotService');

const PORT = process.env.PORT || 5000;

syncDB().then(() => {
  app.listen(PORT, () => console.log(`Shadow IT backend running on port ${PORT}`));

  // Slack digest: fires at the top of every hour (UTC), sends to workspaces whose digest_hour matches
  cron.schedule('0 * * * *', () => {
    runDigestCron().catch(e => console.error('[SlackBot cron]', e.message));
  });
  console.log('Slack digest cron scheduled (hourly)');
}).catch(err => {
  console.error('DB sync failed:', err);
  process.exit(1);
});
