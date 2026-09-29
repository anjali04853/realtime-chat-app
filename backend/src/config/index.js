require('dotenv').config();

const path = require('path');

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const config = {
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 4000),
  // Comma-separated list of allowed origins, or "*" to allow all.
  corsOrigin: process.env.CORS_ORIGIN || '*',
  // When set, messages are stored in MongoDB. Otherwise a local JSON file is used.
  mongoUri: process.env.MONGODB_URI || '',
  dataFile: process.env.DATA_FILE || path.join(__dirname, '..', '..', 'data', 'messages.json'),
  messages: {
    maxLength: toInt(process.env.MESSAGE_MAX_LENGTH, 1000),
    defaultPageSize: 50,
    maxPageSize: 100,
  },
  username: {
    minLength: 2,
    maxLength: 20,
  },
};

config.corsOrigins =
  config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map((o) => o.trim());

module.exports = config;
