const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Stores messages in memory and persists them to a JSON file, so chat history
 * survives server restarts without requiring a database. Writes are debounced
 * and done atomically (write temp file, then rename).
 */
class FileMessageRepository {
  constructor(filePath, { flushDelayMs = 200 } = {}) {
    this.filePath = filePath;
    this.flushDelayMs = flushDelayMs;
    this.messages = [];
    this.flushTimer = null;
    this.writing = Promise.resolve();
  }

  async init() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.messages = Array.isArray(parsed) ? parsed : [];
      logger.info(`Loaded ${this.messages.length} messages from ${this.filePath}`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        logger.warn(`Could not read ${this.filePath} (${err.message}); starting with empty history`);
      }
      this.messages = [];
    }
  }

  async create({ username, text, clientId }) {
    const message = {
      id: crypto.randomUUID(),
      username,
      text,
      clientId,
      createdAt: new Date().toISOString(),
      deliveredTo: [],
      readBy: [],
    };
    this.messages.push(message);
    this.scheduleFlush();
    return { ...message };
  }

  async findByClientId(username, clientId) {
    const found = this.messages.find((m) => m.username === username && m.clientId === clientId);
    return found ? { ...found } : null;
  }

  async findRecent({ limit, before }) {
    let end = this.messages.length;
    if (before) {
      const beforeTime = new Date(before).getTime();
      end = this.messages.findIndex((m) => new Date(m.createdAt).getTime() >= beforeTime);
      if (end === -1) end = this.messages.length;
    }
    return this.messages.slice(Math.max(0, end - limit), end).map((m) => ({ ...m }));
  }

  async addReceipt(ids, username, field) {
    const idSet = new Set(ids);
    const updated = [];
    for (const message of this.messages) {
      if (!idSet.has(message.id) || message.username === username) continue;
      if (message[field].includes(username)) continue;
      message[field].push(username);
      updated.push({ ...message });
    }
    if (updated.length) this.scheduleFlush();
    return updated;
  }

  scheduleFlush() {
    clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => this.flush(), this.flushDelayMs);
  }

  flush() {
    clearTimeout(this.flushTimer);
    this.flushTimer = null;
    const snapshot = JSON.stringify(this.messages);
    this.writing = this.writing
      .then(async () => {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        const tmp = `${this.filePath}.tmp`;
        await fs.writeFile(tmp, snapshot, 'utf8');
        await fs.rename(tmp, this.filePath);
      })
      .catch((err) => logger.error('Failed to persist messages:', err.message));
    return this.writing;
  }

  async close() {
    if (this.flushTimer) await this.flush();
    await this.writing;
  }
}

module.exports = FileMessageRepository;
