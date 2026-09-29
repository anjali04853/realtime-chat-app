const { EventEmitter } = require('events');
const config = require('../config');
const AppError = require('../utils/AppError');
const {
  validateUsername,
  validateMessageText,
  validateClientId,
  validateIdList,
} = require('../utils/validators');

/**
 * Business logic for messages. Transport-agnostic: both the REST controller and
 * the socket handlers call into it, and it emits events that the socket layer
 * broadcasts, so a message sent over REST still reaches everyone in real time.
 *
 * Events:
 *   "message:created" (message)
 *   "message:status"  ([{ id, deliveredTo, readBy }])
 */
class MessageService extends EventEmitter {
  constructor(repository) {
    super();
    this.repository = repository;
  }

  async sendMessage({ username, text, clientId }) {
    const cleanUsername = validateUsername(username);
    const cleanText = validateMessageText(text);
    const cleanClientId = validateClientId(clientId);

    // Idempotent retries: a client resending the same message gets the stored copy.
    if (cleanClientId) {
      const existing = await this.repository.findByClientId(cleanUsername, cleanClientId);
      if (existing) return { message: existing, created: false };
    }

    const message = await this.repository.create({
      username: cleanUsername,
      text: cleanText,
      clientId: cleanClientId,
    });
    this.emit('message:created', message);
    return { message, created: true };
  }

  async getHistory({ limit, before } = {}) {
    const { defaultPageSize, maxPageSize } = config.messages;
    let pageSize = defaultPageSize;
    if (limit !== undefined) {
      pageSize = Number.parseInt(limit, 10);
      if (Number.isNaN(pageSize) || pageSize < 1) throw AppError.badRequest('limit must be a positive integer');
      pageSize = Math.min(pageSize, maxPageSize);
    }
    if (before !== undefined && Number.isNaN(new Date(before).getTime())) {
      throw AppError.badRequest('before must be a valid ISO date');
    }

    // Fetch one extra row to know whether older messages exist.
    const rows = await this.repository.findRecent({ limit: pageSize + 1, before });
    const hasMore = rows.length > pageSize;
    return { messages: hasMore ? rows.slice(1) : rows, hasMore };
  }

  async markDelivered(ids, username) {
    const updated = await this.repository.addReceipt(validateIdList(ids), username, 'deliveredTo');
    this.emitStatus(updated);
    return updated;
  }

  async markRead(ids, username) {
    const cleanIds = validateIdList(ids);
    // Reading a message implies it was delivered.
    const delivered = await this.repository.addReceipt(cleanIds, username, 'deliveredTo');
    const read = await this.repository.addReceipt(cleanIds, username, 'readBy');
    const byId = new Map([...delivered, ...read].map((m) => [m.id, m]));
    const updated = [...byId.values()];
    this.emitStatus(updated);
    return updated;
  }

  emitStatus(messages) {
    if (!messages.length) return;
    this.emit(
      'message:status',
      messages.map(({ id, deliveredTo, readBy }) => ({ id, deliveredTo, readBy })),
    );
  }
}

module.exports = MessageService;
