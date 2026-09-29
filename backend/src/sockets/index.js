const { Server } = require('socket.io');
const config = require('../config');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { validateUsername } = require('../utils/validators');
const EVENTS = require('./events');

const TYPING_TIMEOUT_MS = 5000;

/**
 * Wraps a socket event handler so that it never throws: errors are logged and
 * returned to the client through the acknowledgement callback (if provided).
 */
const safeHandler = (socket, handler) => async (payload, ack) => {
  const reply = typeof ack === 'function' ? ack : () => {};
  try {
    const result = await handler(payload || {});
    reply({ ok: true, ...result });
  } catch (err) {
    const isExpected = err instanceof AppError;
    if (!isExpected) logger.error(`Socket handler error (${socket.data.username}):`, err);
    reply({ ok: false, error: isExpected ? err.message : 'Something went wrong' });
  }
};

function attachSocketServer(httpServer, { messageService, presenceService }) {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigins },
    // Small payloads only; protects against oversized messages.
    maxHttpBufferSize: 1e5,
  });

  // Dummy auth: the client passes its username in the handshake.
  io.use((socket, next) => {
    try {
      socket.data.username = validateUsername(socket.handshake.auth && socket.handshake.auth.username);
      next();
    } catch (err) {
      next(new Error(err.message));
    }
  });

  // Service events -> broadcasts
  messageService.on('message:created', (message) => io.emit(EVENTS.MESSAGE_NEW, message));
  messageService.on('message:status', (updates) => io.emit(EVENTS.MESSAGE_STATUS, updates));
  presenceService.on('presence:changed', (users) => io.emit(EVENTS.PRESENCE_UPDATE, users));
  presenceService.on('typing:changed', (usernames) => io.emit(EVENTS.TYPING_UPDATE, usernames));

  io.on('connection', (socket) => {
    const { username } = socket.data;
    let typingTimer = null;

    logger.info(`${username} connected (${socket.id})`);
    presenceService.connect(username, socket.id);

    // Initial state for the newly connected client.
    socket.emit(EVENTS.PRESENCE_UPDATE, presenceService.getUsers());
    socket.emit(EVENTS.TYPING_UPDATE, presenceService.getTyping());

    const stopTyping = () => {
      clearTimeout(typingTimer);
      typingTimer = null;
      presenceService.setTyping(username, false);
    };

    socket.on(
      EVENTS.MESSAGE_SEND,
      safeHandler(socket, async ({ text, clientId }) => {
        stopTyping();
        const { message } = await messageService.sendMessage({ username, text, clientId });
        return { message };
      }),
    );

    socket.on(
      EVENTS.MESSAGE_DELIVERED,
      safeHandler(socket, async ({ ids }) => {
        await messageService.markDelivered(ids, username);
        return {};
      }),
    );

    socket.on(
      EVENTS.MESSAGE_READ,
      safeHandler(socket, async ({ ids }) => {
        await messageService.markRead(ids, username);
        return {};
      }),
    );

    socket.on(EVENTS.TYPING_START, () => {
      presenceService.setTyping(username, true);
      // Auto-expire in case the client never sends typing:stop.
      clearTimeout(typingTimer);
      typingTimer = setTimeout(stopTyping, TYPING_TIMEOUT_MS);
    });

    socket.on(EVENTS.TYPING_STOP, stopTyping);

    socket.on('disconnect', (reason) => {
      logger.info(`${username} disconnected (${reason})`);
      clearTimeout(typingTimer);
      presenceService.disconnect(username, socket.id);
    });

    socket.on('error', (err) => logger.error(`Socket error (${username}):`, err.message));
  });

  return io;
}

module.exports = attachSocketServer;
