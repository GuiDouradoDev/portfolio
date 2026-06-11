const express = require('express');
const router = express.Router();

router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.redirect('/#contact?error=Preencha+todos+os+campos+obrigat%C3%B3rios');
  }
  req.run('INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
    [name, email, subject || '', message]);
  res.redirect('/#contact?success=Mensagem+enviada+com+sucesso%21');
});

router.get('/', (req, res) => {
  const projects = req.queryAll('SELECT * FROM projects ORDER BY featured DESC, sort_order ASC');
  const skills = req.queryAll('SELECT * FROM skills ORDER BY sort_order ASC');
  res.render('index', { projects, skills });
});

module.exports = router;
