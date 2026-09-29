const express = require('express');
const cors = require('cors');
const config = require('./config');
const createRouter = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp(services) {
  const app = express();

  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '16kb' }));

  app.get('/', (req, res) => res.json({ name: 'realtime-chat-backend', docs: '/api/health' }));
  app.use('/api', createRouter(services));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
