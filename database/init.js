const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'portfolio.db');
let SQL = null;
let db = null;

async function getDb() {
  if (db) return db;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

async function initDb() {
  const d = await getDb();

  d.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      full_description TEXT,
      technologies TEXT,
      image_url TEXT,
      live_url TEXT,
      github_url TEXT,
      featured INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      level INTEGER DEFAULT 0,
      icon_class TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  d.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDb();
  return d;
}

async function seedDefaultData() {
  const d = await getDb();

  const userCount = d.exec('SELECT COUNT(*) as count FROM users');
  const userRow = userCount[0]?.values[0][0];
  if (!userRow || userRow === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    d.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', ['admin', hash]);
  }

  const defaultSettings = [
    ['hero_title', 'Guilherme'],
    ['hero_subtitle', 'Desenvolvedor Full Stack'],
    ['hero_description', 'Crio soluções digitais elegantes e funcionais. Transformo ideias em experiências web memoráveis.'],
    ['hero_greeting', 'Olá, eu sou'],
    ['hero_btn_projects', 'Ver Projetos'],
    ['hero_btn_contact', 'Entrar em Contato'],
    ['about_title', 'Sobre Mim'],
    ['about_content', 'Desenvolvedor apaixonado por tecnologia, especializado em criar aplicações web modernas e responsivas. Tenho experiência em diversas tecnologias e estou sempre em busca de novos desafios.'],
    ['about_image', ''],
    ['section_projects_title', 'Projetos'],
    ['section_skills_title', 'Habilidades'],
    ['section_contact_title', 'Contato'],
    ['project_badge_featured', 'Destaque'],
    ['project_btn_demo', 'Demo'],
    ['project_btn_code', 'Código'],
    ['project_empty', 'Nenhum projeto cadastrado ainda.'],
    ['skills_empty', 'Nenhuma habilidade cadastrada ainda.'],
    ['contact_label_email', 'Email'],
    ['contact_label_whatsapp', 'WhatsApp'],
    ['contact_label_github', 'GitHub'],
    ['contact_label_linkedin', 'LinkedIn'],
    ['contact_form_name', 'Seu nome'],
    ['contact_form_email', 'Seu email'],
    ['contact_form_subject', 'Assunto'],
    ['contact_form_message', 'Sua mensagem'],
    ['contact_form_submit', 'Enviar Mensagem'],
    ['contact_email', 'contato@guilherme.dev'],
    ['contact_phone', '5511999999999'],
    ['contact_github', 'https://github.com/GuiDouradoDev'],
    ['contact_linkedin', 'https://linkedin.com/in/guilherme'],
    ['nav_home', 'Início'],
    ['nav_about', 'Sobre'],
    ['nav_projects', 'Projetos'],
    ['nav_skills', 'Habilidades'],
    ['nav_contact', 'Contato'],
    ['footer_text', '© 2026 Guilherme. Todos os direitos reservados.'],
    ['site_title', 'Guilherme - Portfolio'],
    ['site_description', 'Portfolio profissional de Guilherme, desenvolvedor full stack.'],
    ['error_404_title', '404'],
    ['error_404_message', 'Página não encontrada'],
    ['error_404_button', 'Voltar ao início'],
  ];
  const stmt = d.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of defaultSettings) {
    stmt.run([key, value]);
  }
  stmt.free();

  saveDb();
}

// Helper: run a query and return all rows as objects
function queryAll(sql, params = []) {
  if (!db) return [];
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      rows.push(row);
    }
    stmt.free();
    return rows;
  } catch (e) {
    console.error('Query error:', e.message);
    return [];
  }
}

// Helper: run a query and return first row as object
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

// Helper: run a statement
function run(sql, params = []) {
  if (!db) return;
  try {
    if (params.length > 0) {
      db.run(sql, params);
    } else {
      db.run(sql);
    }
    saveDb();
  } catch (e) {
    console.error('Run error:', e.message);
  }
}

module.exports = { initDb, seedDefaultData, getDb, saveDb, queryAll, queryOne, run };
