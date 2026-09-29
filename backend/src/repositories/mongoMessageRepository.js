const mongoose = require('mongoose');
const Message = require('../models/Message');
const logger = require('../utils/logger');

const toDto = (doc) => ({
  id: doc._id.toString(),
  username: doc.username,
  text: doc.text,
  clientId: doc.clientId,
  createdAt: doc.createdAt.toISOString(),
  deliveredTo: doc.deliveredTo || [],
  readBy: doc.readBy || [],
});

/** MongoDB-backed message storage (used when MONGODB_URI is set). */
class MongoMessageRepository {
  constructor(uri) {
    this.uri = uri;
  }

  async init() {
    await mongoose.connect(this.uri, { serverSelectionTimeoutMS: 10000 });
    logger.info('Connected to MongoDB');
  }

  async create({ username, text, clientId }) {
    const doc = await Message.create({ username, text, clientId });
    return toDto(doc);
  }

  async findByClientId(username, clientId) {
    const doc = await Message.findOne({ username, clientId }).lean();
    return doc ? toDto(doc) : null;
  }

  async findRecent({ limit, before }) {
    const filter = before ? { createdAt: { $lt: new Date(before) } } : {};
    const docs = await Message.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    return docs.reverse().map(toDto);
  }

  async addReceipt(ids, username, field) {
    const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
    const filter = { _id: { $in: validIds }, username: { $ne: username }, [field]: { $ne: username } };
    const toUpdate = await Message.find(filter, { _id: 1 }).lean();
    if (!toUpdate.length) return [];

    const updatedIds = toUpdate.map((d) => d._id);
    await Message.updateMany({ _id: { $in: updatedIds } }, { $addToSet: { [field]: username } });
    const docs = await Message.find({ _id: { $in: updatedIds } }).lean();
    return docs.map(toDto);
  }

  async close() {
    await mongoose.disconnect();
  }
}

module.exports = MongoMessageRepository;
