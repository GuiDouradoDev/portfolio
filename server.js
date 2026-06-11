require('dotenv').config();
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const { initDb, seedDefaultData, queryAll, queryOne, run, saveDb } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  store: new FileStore({ path: path.join(__dirname, 'database', 'sessions') }),
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

function loadSettings(req) {
  const rows = req.queryAll('SELECT key, value FROM settings');
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

app.use((req, res, next) => {
  req.queryAll = queryAll;
  req.queryOne = queryOne;
  req.run = run;
  req.saveDb = saveDb;
  res.locals.session = req.session;
  res.locals.path = req.path;
  res.locals.settings = loadSettings(req);
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));
app.use('/auth', require('./routes/auth'));

app.use((req, res) => {
  res.status(404).render('404');
});

async function start() {
  await initDb();
  await seedDefaultData();
  app.listen(PORT, () => {
    console.log(`Portfolio running at http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/admin/login`);
    console.log(`Login: admin / admin123`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
