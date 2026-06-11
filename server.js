require('dotenv').config();
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { initDb, seedDefaultData, queryAll, queryOne, run, saveDb } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  store: new FileStore({ path: path.join(__dirname, 'database', 'sessions') }),
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
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

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).send('Erro interno do servidor');
});

async function start() {
  await initDb();
  await seedDefaultData();

  const sessionsDir = path.join(__dirname, 'database', 'sessions');
  if (fs.existsSync(sessionsDir)) {
    for (const file of fs.readdirSync(sessionsDir)) {
      if (file.endsWith('.json')) fs.unlinkSync(path.join(sessionsDir, file));
    }
  }

  app.listen(PORT, () => {
    console.log(`Portfolio running at http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
