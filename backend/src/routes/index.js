const express = require('express');
const createMessageController = require('../controllers/messageController');
const createUserController = require('../controllers/userController');

function createRouter({ messageService, presenceService }) {
  const router = express.Router();
  const messages = createMessageController(messageService);
  const users = createUserController(presenceService);

  router.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  router.post('/auth/login', users.login);
  router.get('/users', users.list);

  router.get('/messages', messages.list);
  router.post('/messages', messages.create);

  return router;
}

module.exports = createRouter;
