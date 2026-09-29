const config = require('../config');
const FileMessageRepository = require('./fileMessageRepository');
const MongoMessageRepository = require('./mongoMessageRepository');

/**
 * Picks the storage implementation. Both expose the same interface:
 * init, create, findByClientId, findRecent, addReceipt, close.
 */
function createMessageRepository() {
  if (config.mongoUri) return new MongoMessageRepository(config.mongoUri);
  return new FileMessageRepository(config.dataFile);
}

module.exports = { createMessageRepository };
