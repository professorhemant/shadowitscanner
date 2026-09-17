'use strict';

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ message, ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}) });
}

module.exports = { errorHandler };
