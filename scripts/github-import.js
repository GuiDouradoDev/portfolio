const https = require('https');
const path = require('path');
const { initDb, getDb, queryAll, run, saveDb } = require('../database/init');

const GITHUB_USERNAME = 'GuiDouradoDev';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Portfolio-Import' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          reject(new Error(`Failed to parse: ${data.slice(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchAllRepos() {
  const repos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=updated&type=owner`;
    const { status, data, headers } = await httpsGet(url);

    if (status !== 200) {
      console.error('GitHub API error:', data.message || status);
      process.exit(1);
    }

    repos.push(...data);

    const link = headers['link'] || '';
    hasMore = link.includes('rel="next"');
    page++;
  }

  return repos;
}

async function importProjects() {
  console.log(`Buscando repositórios de ${GITHUB_USERNAME}...`);
  const repos = await fetchAllRepos();
  console.log(`Encontrados ${repos.length} repositórios.`);

  await initDb();

  const existing = queryAll('SELECT github_url FROM projects');
  const existingUrls = new Set(existing.map(p => p.github_url));

  let imported = 0;
  let skipped = 0;

  for (const repo of repos) {
    const githubUrl = repo.html_url;

    if (existingUrls.has(githubUrl)) {
      skipped++;
      continue;
    }

    const title = repo.name;
    const description = repo.description || repo.name;
    const technologies = [repo.language, ...(repo.topics || [])].filter(Boolean).join(', ');
    const liveUrl = repo.homepage || '';
    const imageUrl = repo.owner?.avatar_url || '';

    run(
      `INSERT INTO projects (title, description, full_description, technologies, image_url, live_url, github_url, featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description.slice(0, 500),
        description,
        technologies,
        '',
        liveUrl,
        githubUrl,
        0,
        0
      ]
    );

    console.log(`  + Importado: ${title}`);
    imported++;
  }

  console.log(`\nConcluído! ${imported} importados, ${skipped} já existentes.`);
  process.exit(0);
}

importProjects().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
