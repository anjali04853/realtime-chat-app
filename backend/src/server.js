const http = require('http');
const config = require('./config');
const logger = require('./utils/logger');
const createApp = require('./app');
const attachSocketServer = require('./sockets');
const MessageService = require('./services/messageService');
const PresenceService = require('./services/presenceService');
const { createMessageRepository } = require('./repositories');

/**
 * Wires the application together. Exported so tests can start an isolated
 * server with their own repository and port.
 */
async function startServer({ port = config.port, repository = createMessageRepository() } = {}) {
  await repository.init();

  const messageService = new MessageService(repository);
  const presenceService = new PresenceService();
  const app = createApp({ messageService, presenceService });
  const httpServer = http.createServer(app);
  const io = attachSocketServer(httpServer, { messageService, presenceService });

  await new Promise((resolve) => httpServer.listen(port, resolve));

  const stop = async () => {
    await new Promise((resolve) => io.close(() => resolve()));
    await repository.close();
  };

  return { httpServer, io, stop, port: httpServer.address().port };
}

if (require.main === module) {
  startServer()
    .then(({ port, stop }) => {
      logger.info(`Server listening on port ${port} (${config.mongoUri ? 'MongoDB' : 'file'} storage)`);

      const shutdown = (signal) => {
        logger.info(`${signal} received, shutting down`);
        stop()
          .catch((err) => logger.error('Error during shutdown:', err))
          .finally(() => process.exit(0));
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    })
    .catch((err) => {
      logger.error('Failed to start server:', err);
      process.exit(1);
    });

  process.on('unhandledRejection', (err) => logger.error('Unhandled rejection:', err));
}

module.exports = { startServer };
