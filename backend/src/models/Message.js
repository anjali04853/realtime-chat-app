const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, index: true },
    text: { type: String, required: true },
    clientId: { type: String },
    deliveredTo: { type: [String], default: [] },
    readBy: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ createdAt: -1 });
// Makes retries of the same client message idempotent.
messageSchema.index({ username: 1, clientId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
