'use strict';

const fs = require('fs');

function toJSON(results, outputPath) {
  const payload = {
    generated_at: new Date().toISOString(),
    scanner: 'shadow-audit',
    results,
  };
  const json = JSON.stringify(payload, null, 2);
  if (outputPath) {
    fs.writeFileSync(outputPath, json, 'utf8');
    return outputPath;
  }
  return json;
}

module.exports = { toJSON };
