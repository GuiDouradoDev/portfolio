const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = req.queryOne('SELECT * FROM users WHERE username = ?', [username]);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.redirect('/admin/login?error=Credenciais+inv%C3%A1lidas');
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;
