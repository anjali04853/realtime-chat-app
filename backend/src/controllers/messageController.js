const asyncHandler = require('../utils/asyncHandler');

const createMessageController = (messageService) => ({
  list: asyncHandler(async (req, res) => {
    const { limit, before } = req.query;
    const result = await messageService.getHistory({ limit, before });
    res.json(result);
  }),

  create: asyncHandler(async (req, res) => {
    const { username, text, clientId } = req.body || {};
    const { message, created } = await messageService.sendMessage({ username, text, clientId });
    res.status(created ? 201 : 200).json({ message });
  }),
});

module.exports = createMessageController;
