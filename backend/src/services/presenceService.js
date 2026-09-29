const { EventEmitter } = require('events');

/**
 * In-memory presence and typing state. A user can have several sockets open
 * (multiple tabs/devices); they are online while at least one is connected.
 *
 * Events:
 *   "presence:changed" (users)
 *   "typing:changed"   (usernames)
 */
class PresenceService extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // username -> Set<socketId>
    this.lastSeen = new Map(); // username -> ISO string
    this.typing = new Set(); // usernames currently typing
  }

  connect(username, socketId) {
    const sockets = this.connections.get(username) || new Set();
    const wasOffline = sockets.size === 0;
    sockets.add(socketId);
    this.connections.set(username, sockets);
    if (wasOffline) this.emit('presence:changed', this.getUsers());
  }

  disconnect(username, socketId) {
    const sockets = this.connections.get(username);
    if (!sockets) return;
    sockets.delete(socketId);
    if (sockets.size > 0) return;

    this.connections.delete(username);
    this.lastSeen.set(username, new Date().toISOString());
    this.setTyping(username, false);
    this.emit('presence:changed', this.getUsers());
  }

  isOnline(username) {
    return this.connections.has(username);
  }

  setTyping(username, isTyping) {
    const changed = isTyping ? !this.typing.has(username) : this.typing.has(username);
    if (!changed) return;
    if (isTyping) this.typing.add(username);
    else this.typing.delete(username);
    this.emit('typing:changed', this.getTyping());
  }

  getTyping() {
    return [...this.typing];
  }

  /** Online users first, then recently-seen offline users. */
  getUsers() {
    const online = [...this.connections.keys()].map((username) => ({
      username,
      online: true,
      lastSeen: null,
    }));
    const offline = [...this.lastSeen.entries()]
      .filter(([username]) => !this.connections.has(username))
      .map(([username, lastSeen]) => ({ username, online: false, lastSeen }))
      .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
    return [...online.sort((a, b) => a.username.localeCompare(b.username)), ...offline];
  }
}

module.exports = PresenceService;
