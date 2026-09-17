'use strict';

require('dotenv').config();
const app = require('./app');
const { syncDB } = require('./models');

const PORT = process.env.PORT || 5000;

syncDB().then(() => {
  app.listen(PORT, () => console.log(`Shadow IT backend running on port ${PORT}`));
}).catch(err => {
  console.error('DB sync failed:', err);
  process.exit(1);
});
