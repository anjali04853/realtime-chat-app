// Single source of truth for socket event names (mirrored in the frontend).
module.exports = {
  // client -> server
  MESSAGE_SEND: 'message:send',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // server -> client
  MESSAGE_NEW: 'message:new',
  MESSAGE_STATUS: 'message:status',
  PRESENCE_UPDATE: 'presence:update',
  TYPING_UPDATE: 'typing:update',
};
