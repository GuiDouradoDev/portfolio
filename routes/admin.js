const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');
const { analyzeProject } = require('../scripts/project-analyzer');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

const uploadFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 2000 },
  fileFilter: (req, file, cb) => {
    const normalized = path.normalize(file.originalname).replace(/\\/g, '/');
    if (normalized === '.' || normalized.startsWith('..')) {
      return cb(new Error('Nome de arquivo inválido'));
    }
    cb(null, true);
  }
});

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/admin/login');
  }
  next();
}

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/admin');
  res.render('admin/login', { error: req.query.error || null });
});

router.use(requireAuth);

router.get('/', (req, res) => {
  const projectCount = req.queryOne('SELECT COUNT(*) as count FROM projects');
  const messageCount = req.queryOne('SELECT COUNT(*) as count FROM messages');
  const unreadMessages = req.queryOne('SELECT COUNT(*) as count FROM messages WHERE read = 0');
  const recentMessages = req.queryAll('SELECT * FROM messages ORDER BY created_at DESC LIMIT 5');

  res.render('admin/dashboard', {
    projectCount: projectCount.count,
    messageCount: messageCount.count,
    unreadMessages: unreadMessages.count,
    recentMessages
  });
});

// --- Helpers ---

const IGNORED_DIRS_LOCAL = new Set(['node_modules', '.git', '.jdk', 'target', '.next', 'dist', 'build', '.cache', '__pycache__', '.vscode', '.idea', '.mvn']);

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS_LOCAL.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function uploadMiddleware(req, res, next) {
  uploadFiles.array('files')(req, res, function(err) {
    if (err) {
      console.error('Multer error:', err.message);
      return res.render('admin/project-import', { result: null, error: 'Erro no upload: ' + err.message });
    }
    next();
  });
}

function processUploadedFiles(files, tempDir) {
  for (const file of files) {
    const relativePath = path.normalize(decodeURIComponent(file.originalname)).replace(/\\/g, '/');
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error('Caminho de arquivo inválido: ' + relativePath);
    }
    const fullPath = path.join(tempDir, relativePath);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(fullPath, file.buffer);
  }

  const rootName = decodeURIComponent(files[0].originalname).split(/[\/\\]/)[0];
  const projectBase = path.join(tempDir, rootName);
  return fs.existsSync(projectBase) ? projectBase : tempDir;
}

// --- Routes: specific before parameterized ---

router.get('/projects', (req, res) => {
  const projects = req.queryAll('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC');
  res.render('admin/projects', { projects, github_result: req.query.github_result || null });
});

router.get('/projects/new', (req, res) => {
  res.render('admin/project-edit', { project: null });
});

router.get('/projects/import', (req, res) => {
  res.render('admin/project-import', { result: null, error: null });
});

router.post('/projects', upload.single('image'), (req, res) => {
  const { title, description, full_description, technologies, live_url, github_url, featured } = req.body;
  const image_url = req.file ? '/uploads/' + req.file.filename : '';

  req.run(
    `INSERT INTO projects (title, description, full_description, technologies, image_url, live_url, github_url, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, full_description, technologies, image_url, live_url, github_url, featured ? 1 : 0]
  );

  res.redirect('/admin/projects');
});

router.post('/projects/import', uploadMiddleware, (req, res) => {
  if (!req.files || req.files.length === 0) {
    console.log('Upload: no files received');
    return res.render('admin/project-import', { result: null, error: 'Nenhum arquivo enviado. Arraste uma pasta ou selecione arquivos.' });
  }

  console.log('Upload received: ' + req.files.length + ' files, first: ' + req.files[0].originalname);
  const tempDir = path.join(__dirname, '..', 'uploads', 'temp', Date.now().toString());
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const actualBase = processUploadedFiles(req.files, tempDir);
    const result = analyzeProject(fs, actualBase);
    result.temp_dir = path.relative(path.join(__dirname, '..'), tempDir);
    res.render('admin/project-import', { result, error: null });
  } catch (err) {
    console.error('Import error:', err);
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
    res.render('admin/project-import', { result: null, error: 'Erro ao processar projeto: ' + err.message });
  }
});

router.post('/projects/import/local', (req, res) => {
  const { local_path } = req.body;
  if (!local_path) return res.render('admin/project-import', { result: null, error: 'Informe o caminho da pasta do projeto.' });

  const resolvedPath = path.resolve(local_path.trim());
  if (!fs.existsSync(resolvedPath)) return res.render('admin/project-import', { result: null, error: 'Caminho não encontrado: ' + resolvedPath });
  if (!fs.statSync(resolvedPath).isDirectory()) return res.render('admin/project-import', { result: null, error: 'O caminho deve ser uma pasta.' });

  const tempDir = path.join(__dirname, '..', 'uploads', 'temp', Date.now().toString());
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });

  try {
    copyDirSync(resolvedPath, tempDir);
    const result = analyzeProject(fs, tempDir);
    result.temp_dir = path.relative(path.join(__dirname, '..'), tempDir);
    res.render('admin/project-import', { result, error: null });
  } catch (err) {
    console.error('Local import error:', err);
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
    res.render('admin/project-import', { result: null, error: 'Erro ao importar projeto: ' + err.message });
  }
});

router.post('/projects/import/confirm', (req, res) => {
  const { title, description, full_description, technologies, live_url, github_url, featured, temp_dir, create_github, github_repo_name, github_description, github_private } = req.body;

  if (!temp_dir || !temp_dir.startsWith('uploads/temp/')) {
    return res.redirect('/admin/projects');
  }

  req.run(
    `INSERT INTO projects (title, description, full_description, technologies, image_url, live_url, github_url, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, full_description, technologies, '', live_url, github_url, featured ? 1 : 0]
  );

  const projectId = req.queryOne('SELECT last_insert_rowid() as id').id;

  let githubResult = null;

  if (create_github) {
    try {
      const ghPath = 'C:\\Program Files\\GitHub CLI\\gh.exe';
      const extractDir = path.resolve(path.join(__dirname, '..', temp_dir));
      const repoName = github_repo_name || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const repoDesc = github_description || description || '';
      const visibility = github_private ? '--private' : '--public';

      const ghAuth = execSync(`"${ghPath}" auth status`, { cwd: extractDir, encoding: 'utf-8', timeout: 10000 }).trim();
      if (ghAuth.includes('not logged')) {
        githubResult = 'GitHub CLI não está autenticado. Execute gh auth login no terminal.';
      } else {
        if (!fs.existsSync(path.join(extractDir, '.git'))) {
          execSync(`git init && git add -A && git commit -m "Initial commit"`, { cwd: extractDir, encoding: 'utf-8', timeout: 15000 });
        }

        const repoUrl = execSync(
          `"${ghPath}" repo create "${repoName}" ${visibility} --description "${repoDesc.replace(/"/g, '\\"')}"`,
          { cwd: extractDir, encoding: 'utf-8', timeout: 30000 }
        ).trim();

        try {
          execSync(`git remote add origin ${repoUrl} && git push -u origin master`, { cwd: extractDir, encoding: 'utf-8', timeout: 60000 });
        } catch (pushErr) {
          console.error('Push warning:', pushErr.message);
        }

        githubResult = `Repositório criado: ${repoUrl}`;

        const repoMatch = repoUrl.match(/https:\/\/github\.com\/[\w-]+\/[\w.-]+/);
        if (repoMatch) {
          req.run('UPDATE projects SET github_url = ? WHERE id = ?', [repoMatch[0], projectId]);
        }
      }
    } catch (ghErr) {
      console.error('GitHub error:', ghErr.message);
      githubResult = `Erro ao criar repositório: ${ghErr.message}`;
    }
  }

  try {
    const fullExtractDir = path.resolve(path.join(__dirname, '..', temp_dir));
    if (fs.existsSync(fullExtractDir)) fs.rmSync(fullExtractDir, { recursive: true });
  } catch { }

  if (githubResult) {
    res.redirect(`/admin/projects?github_result=${encodeURIComponent(githubResult)}`);
  } else {
    res.redirect('/admin/projects');
  }
});

router.get('/projects/edit/:id', (req, res) => {
  const project = req.queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!project) return res.redirect('/admin/projects');
  res.render('admin/project-edit', { project });
});

router.post('/projects/edit/:id', upload.single('image'), (req, res) => {
  const { title, description, full_description, technologies, live_url, github_url, featured, create_github } = req.body;
  const project = req.queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);

  let image_url = project.image_url;
  if (req.file) {
    image_url = '/uploads/' + req.file.filename;
  }

  req.run(
    `UPDATE projects SET title = ?, description = ?, full_description = ?, technologies = ?,
    image_url = ?, live_url = ?, github_url = ?, featured = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [title, description, full_description, technologies, image_url, live_url, github_url, featured ? 1 : 0, req.params.id]
  );

  let githubResult = null;

  if (create_github) {
    try {
      const ghPath = 'C:\\Program Files\\GitHub CLI\\gh.exe';
      const repoName = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const repoDesc = description || '';

      const ghAuth = execSync(`"${ghPath}" auth status`, { encoding: 'utf-8', timeout: 10000 }).trim();
      if (ghAuth.includes('not logged')) {
        githubResult = 'GitHub CLI não está autenticado. Execute gh auth login no terminal.';
      } else {
        const repoUrl = execSync(
          `"${ghPath}" repo create "${repoName}" --public --description "${repoDesc.replace(/"/g, '\\"')}"`,
          { encoding: 'utf-8', timeout: 30000 }
        ).trim();
        githubResult = `Repositório criado: ${repoUrl}`;

        const repoMatch = repoUrl.match(/https:\/\/github\.com\/[\w-]+\/[\w.-]+/);
        if (repoMatch) {
          req.run('UPDATE projects SET github_url = ? WHERE id = ?', [repoMatch[0], req.params.id]);
        }
      }
    } catch (ghErr) {
      console.error('GitHub error:', ghErr.message);
      githubResult = `Erro ao criar repositório: ${ghErr.message}`;
    }
  }

  if (githubResult) {
    res.redirect(`/admin/projects?github_result=${encodeURIComponent(githubResult)}`);
  } else {
    res.redirect('/admin/projects');
  }
});

router.post('/projects/delete/:id', (req, res) => {
  req.run('DELETE FROM projects WHERE id = ?', [req.params.id]);
  res.redirect('/admin/projects');
});

router.get('/skills', (req, res) => {
  const skills = req.queryAll('SELECT * FROM skills ORDER BY sort_order ASC');
  res.render('admin/skills', { skills });
});

router.post('/skills', (req, res) => {
  const { name, category, icon_class } = req.body;
  req.run('INSERT INTO skills (name, category, icon_class) VALUES (?, ?, ?)',
    [name, category, icon_class]);
  res.redirect('/admin/skills');
});

router.post('/skills/edit/:id', (req, res) => {
  const { name, category, icon_class } = req.body;
  req.run('UPDATE skills SET name = ?, category = ?, icon_class = ? WHERE id = ?',
    [name, category, icon_class, req.params.id]);
  res.redirect('/admin/skills');
});

router.post('/skills/delete/:id', (req, res) => {
  req.run('DELETE FROM skills WHERE id = ?', [req.params.id]);
  res.redirect('/admin/skills');
});

router.get('/settings', (req, res) => {
  const settings = req.queryAll('SELECT * FROM settings ORDER BY key');
  res.render('admin/settings', { settings });
});

router.post('/settings', (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    req.run('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [value, key]);
  }
  res.redirect('/admin/settings');
});

router.get('/change-password', (req, res) => {
  res.render('admin/change-password', { error: null, success: null });
});

router.post('/change-password', (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  const user = req.queryOne('SELECT * FROM users WHERE id = ?', [req.session.userId]);

  if (!bcrypt.compareSync(current_password, user.password_hash)) {
    return res.render('admin/change-password', { error: 'Senha atual incorreta', success: null });
  }

  if (new_password.length < 6) {
    return res.render('admin/change-password', { error: 'A nova senha deve ter pelo menos 6 caracteres', success: null });
  }

  if (new_password !== confirm_password) {
    return res.render('admin/change-password', { error: 'As senhas não conferem', success: null });
  }

  const hash = bcrypt.hashSync(new_password, 10);
  req.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.session.userId]);

  res.render('admin/change-password', { error: null, success: 'Senha alterada com sucesso!' });
});

router.get('/messages', (req, res) => {
  const messages = req.queryAll('SELECT * FROM messages ORDER BY created_at DESC');
  res.render('admin/messages', { messages });
});

router.get('/messages/:id', (req, res) => {
  const message = req.queryOne('SELECT * FROM messages WHERE id = ?', [req.params.id]);
  if (!message) return res.redirect('/admin/messages');
  if (!message.read) {
    req.run('UPDATE messages SET read = 1 WHERE id = ?', [req.params.id]);
    message.read = 1;
  }
  res.render('admin/message-view', { message });
});

router.post('/messages/read/:id', (req, res) => {
  req.run('UPDATE messages SET read = 1 WHERE id = ?', [req.params.id]);
  res.redirect('/admin/messages');
});

router.post('/messages/delete/:id', (req, res) => {
  req.run('DELETE FROM messages WHERE id = ?', [req.params.id]);
  res.redirect('/admin/messages');
});

module.exports = router;
