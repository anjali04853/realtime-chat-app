// Mirrors backend/src/sockets/events.js
export const SOCKET_EVENTS = {
  MESSAGE_SEND: 'message:send',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  MESSAGE_NEW: 'message:new',
  MESSAGE_STATUS: 'message:status',
  PRESENCE_UPDATE: 'presence:update',
  TYPING_UPDATE: 'typing:update',
};
