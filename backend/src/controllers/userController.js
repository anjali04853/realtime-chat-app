const { validateUsername } = require('../utils/validators');

const createUserController = (presenceService) => ({
  // Dummy authentication: any valid username is accepted, no password.
  login: (req, res) => {
    const username = validateUsername(req.body && req.body.username);
    res.json({ user: { username } });
  },

  list: (req, res) => {
    res.json({ users: presenceService.getUsers() });
  },
});

module.exports = createUserController;
