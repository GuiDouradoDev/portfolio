const path = require('path');

function readJson(fs, basePath, fileName) {
  try {
    const p = path.join(basePath, fileName);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

function readFile(fs, basePath, fileName) {
  try {
    const p = path.join(basePath, fileName);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf-8');
  } catch { return null; }
}

function readXmlSimple(fs, basePath, fileName) {
  try {
    const p = path.join(basePath, fileName);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf-8');
  } catch { return null; }
}

function extractXmlTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`);
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

function extractXmlTags(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'g');
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

function detectTechnologiesFromPom(pomXml) {
  if (!pomXml) return [];
  const techs = new Set();

  // Detect Spring Boot
  if (pomXml.includes('spring-boot-starter')) techs.add('Spring Boot');
  if (pomXml.includes('spring-boot-starter-web')) techs.add('Spring Web');
  if (pomXml.includes('spring-boot-starter-data-jpa')) techs.add('Spring Data JPA');
  if (pomXml.includes('spring-boot-starter-security')) techs.add('Spring Security');
  if (pomXml.includes('spring-boot-starter-validation')) techs.add('Spring Validation');
  if (pomXml.includes('spring-boot-starter-mail')) techs.add('Spring Mail');

  if (pomXml.includes('h2')) techs.add('H2 Database');
  if (pomXml.includes('mysql-connector')) techs.add('MySQL');
  if (pomXml.includes('postgresql')) techs.add('PostgreSQL');
  if (pomXml.includes('mongodb')) techs.add('MongoDB');
  if (pomXml.includes('flyway')) techs.add('Flyway');
  if (pomXml.includes('liquibase')) techs.add('Liquibase');

  if (pomXml.includes('jjwt') || pomXml.includes('jwt')) techs.add('JWT');
  if (pomXml.includes('springdoc') || pomXml.includes('swagger')) techs.add('Swagger/OpenAPI');

  if (pomXml.includes('lombok')) techs.add('Lombok');
  if (pomXml.includes('mapstruct')) techs.add('MapStruct');
  if (pomXml.includes('jackson')) techs.add('Jackson');
  if (pomXml.includes('thymeleaf')) techs.add('Thymeleaf');
  if (pomXml.includes('mustache')) techs.add('Mustache');

  if (pomXml.includes('docker') || pomXml.includes('Docker')) techs.add('Docker');
  if (pomXml.includes('junit') || pomXml.includes('mockito')) techs.add('JUnit');

  const javaVersion = extractXmlTag(pomXml, 'java.version');
  if (javaVersion) techs.add(`Java ${javaVersion}`);

  if (pomXml.includes('maven') || pomXml.includes('Maven')) techs.add('Maven');

  return Array.from(techs);
}

function readRequirementsTxt(fs, basePath) {
  try {
    const p = path.join(basePath, 'requirements.txt');
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf-8');
  } catch { return null; }
}

function detectTechnologiesPython(fs, basePath) {
  const techs = new Set();
  techs.add('Python');

  const req = readRequirementsTxt(fs, basePath);
  if (req) {
    const lines = req.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    for (const line of lines) {
      const pkgName = line.replace(/[<>=!~].*$/, '').trim().toLowerCase();
      const pyTechMap = {
        'flask': 'Flask', 'django': 'Django', 'fastapi': 'FastAPI',
        'tornado': 'Tornado', 'aiohttp': 'aiohttp', 'bottle': 'Bottle',
        'pyramid': 'Pyramid', 'cherrypy': 'CherryPy', 'sanic': 'Sanic',
        'requests': 'Requests', 'httpx': 'HTTPX', 'urllib3': 'urllib3',
        'sqlalchemy': 'SQLAlchemy', 'sqlobject': 'SQLObject',
        'psycopg2': 'PostgreSQL', 'pymongo': 'MongoDB', 'redis': 'Redis',
        'pymysql': 'MySQL', 'aiomysql': 'MySQL', 'asyncpg': 'PostgreSQL',
        'numpy': 'NumPy', 'pandas': 'Pandas', 'scipy': 'SciPy',
        'matplotlib': 'Matplotlib', 'seaborn': 'Seaborn', 'plotly': 'Plotly',
        'scikit-learn': 'scikit-learn', 'tensorflow': 'TensorFlow',
        'torch': 'PyTorch', 'keras': 'Keras', 'transformers': 'Hugging Face',
        'pytest': 'Pytest', 'unittest': 'unittest', 'tox': 'Tox',
        'beautifulsoup4': 'Beautiful Soup', 'lxml': 'lxml', 'scrapy': 'Scrapy',
        'celery': 'Celery', 'gunicorn': 'Gunicorn', 'uvicorn': 'Uvicorn',
        'markdown': 'Markdown', 'mistune': 'Markdown', 'mistletoe': 'Markdown',
        'jinja2': 'Jinja2', 'mako': 'Mako', 'pillow': 'Pillow',
        'opencv-python': 'OpenCV', 'python-dotenv': 'dotenv',
        'pydantic': 'Pydantic', 'alembic': 'Alembic',
        'sphinx': 'Sphinx', 'mkdocs': 'MkDocs',
        'fastapi': 'FastAPI', 'uvicorn': 'Uvicorn',
      };
      if (pyTechMap[pkgName]) techs.add(pyTechMap[pkgName]);
    }
  }

  if (fs.existsSync(path.join(basePath, 'setup.py')) ||
      fs.existsSync(path.join(basePath, 'setup.cfg')) ||
      fs.existsSync(path.join(basePath, 'pyproject.toml'))) {
    techs.add('setuptools');
  }

  return Array.from(techs);
}

function detectTechnologies(packageJson) {
  const techs = new Set();
  if (!packageJson) return [];

  const allDeps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };

  const techMap = {
    'react': 'React', 'next': 'Next.js', 'vue': 'Vue.js', 'angular': 'Angular',
    'svelte': 'Svelte', 'nuxt': 'Nuxt.js', 'gatsby': 'Gatsby',
    'express': 'Express', 'fastify': 'Fastify', 'nestjs': 'NestJS',
    'socket.io': 'Socket.IO', 'passport': 'Passport.js',
    'prisma': 'Prisma', 'typeorm': 'TypeORM', 'sequelize': 'Sequelize',
    'mongoose': 'Mongoose', 'knex': 'Knex.js',
    'tailwindcss': 'Tailwind CSS', 'bootstrap': 'Bootstrap',
    'sass': 'Sass', 'less': 'Less', 'postcss': 'PostCSS',
    'webpack': 'Webpack', 'vite': 'Vite', 'esbuild': 'esbuild',
    'typescript': 'TypeScript', 'eslint': 'ESLint', 'prettier': 'Prettier',
    'jest': 'Jest', 'vitest': 'Vitest', 'cypress': 'Cypress',
    'playwright': 'Playwright', 'mocha': 'Mocha', 'chai': 'Chai',
    'electron': 'Electron', 'react-native': 'React Native',
    'graphql': 'GraphQL', 'apollo': 'Apollo',
    'axios': 'Axios', 'swr': 'SWR', 'react-query': 'React Query',
    'zustand': 'Zustand', 'redux': 'Redux', 'mobx': 'MobX',
    'date-fns': 'date-fns', 'lodash': 'Lodash',
    'three': 'Three.js', 'd3': 'D3.js', 'chart.js': 'Chart.js',
    'sql.js': 'SQL.js', 'better-sqlite3': 'SQLite',
    'multer': 'Multer', 'bcryptjs': 'bcryptjs', 'jsonwebtoken': 'JWT',
  };

  for (const [pkg, label] of Object.entries(techMap)) {
    if (allDeps[pkg]) techs.add(label);
  }

  const mainFrameworks = ['React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Express', 'NestJS', 'Fastify', 'Electron'];
  const detected = Array.from(techs);
  const frameworks = detected.filter(t => mainFrameworks.includes(t));
  const others = detected.filter(t => !mainFrameworks.includes(t));
  return [...frameworks, ...others];
}

function detectProjectName(fs, basePath) {
  const pkg = readJson(fs, basePath, 'package.json');
  if (pkg?.name) return pkg.name;
  const pom = readXmlSimple(fs, basePath, 'pom.xml');
  if (pom) {
    const name = extractXmlTag(pom, 'name') || extractXmlTag(pom, 'artifactId');
    if (name) return name;
  }
  // Python: setup.py or pyproject.toml
  const setupPy = readFile(fs, basePath, 'setup.py');
  if (setupPy) {
    const m = setupPy.match(/name\s*=\s*['\"]([^'\"]+)['\"]/);
    if (m) return m[1];
  }
  const pyproject = readFile(fs, basePath, 'pyproject.toml');
  if (pyproject) {
    const m = pyproject.match(/name\s*=\s*['\"]([^'\"]+)['\"]/);
    if (m) return m[1];
  }
  return path.basename(basePath);
}

function detectDescription(fs, basePath) {
  const pkg = readJson(fs, basePath, 'package.json');
  if (pkg?.description) return pkg.description;
  const pom = readXmlSimple(fs, basePath, 'pom.xml');
  if (pom) {
    const desc = extractXmlTag(pom, 'description');
    if (desc) return desc;
  }
  const readme = readFile(fs, basePath, 'README.md');
  if (readme) {
    const firstLine = readme.split('\n').find(l => l.trim() && !l.startsWith('#'));
    if (firstLine) return firstLine.trim();
    const firstH1 = readme.match(/^#\s+(.+)/m);
    if (firstH1) return firstH1[1].trim();
  }
  return '';
}

function detectFullDescription(fs, basePath) {
  const readme = readFile(fs, basePath, 'README.md');
  if (readme) {
    const lines = readme.split('\n');
    const contentLines = lines.filter(l => l.trim());
    if (contentLines.length > 1) {
      return contentLines.slice(1, Math.min(contentLines.length, 50)).join('\n').slice(0, 2000);
    }
    return readme.slice(0, 2000);
  }
  return '';
}

function detectUrls(fs, pkg, pomXml, basePath) {
  const result = { live_url: '', github_url: '' };
  if (pkg) {
    if (pkg.homepage && !pkg.homepage.includes('github.com')) {
      result.live_url = pkg.homepage;
    }
    const repo = pkg.repository;
    if (typeof repo === 'string') {
      const match = repo.match(/github\.com[/:]([^/]+\/[^.]+)/);
      if (match) result.github_url = `https://github.com/${match[1]}`;
    } else if (repo?.url) {
      const match = repo.url.match(/github\.com[/:]([^/]+\/[^.]+)/);
      if (match) result.github_url = `https://github.com/${match[1]}`;
    } else if (pkg.bugs?.url) {
      const match = pkg.bugs.url.match(/github\.com[/:]([^/]+\/[^.]+)/);
      if (match) result.github_url = `https://github.com/${match[1]}`;
    }
  }
  if (!result.github_url && pomXml) {
    const scmMatch = pomXml.match(/<url>([^<]*github\.com[^<]*)<\/url>/);
    if (scmMatch) result.github_url = scmMatch[1];
  }
  if (!result.github_url && basePath) {
    const pyproject = readFile(fs, basePath, 'pyproject.toml');
    if (pyproject) {
      const m = pyproject.match(/homepage\s*=\s*['\"]([^'\"]*github\.com[^'\"]+)['\"]/);
      if (m) result.live_url = m[1];
      const repoMatch = pyproject.match(/repository\s*=\s*['\"]([^'\"]*github\.com[^'\"]+)['\"]/);
      if (repoMatch) result.github_url = repoMatch[1];
    }
  }
  return result;
}

function analyzeProject(fs, basePath) {
  const pkg = readJson(fs, basePath, 'package.json');
  const pom = pkg ? null : readXmlSimple(fs, basePath, 'pom.xml');
  const name = detectProjectName(fs, basePath);
  const description = detectDescription(fs, basePath);
  const fullDescription = detectFullDescription(fs, basePath);
  const technologies = pkg ? detectTechnologies(pkg) : (pom ? detectTechnologiesFromPom(pom) : detectTechnologiesPython(fs, basePath));
  const urls = detectUrls(fs, pkg, pom, basePath);

  return {
    title: name,
    description: description.slice(0, 500),
    full_description: fullDescription,
    technologies: technologies.join(', '),
    ...urls,
  };
}

module.exports = { analyzeProject, readJson, readFile, detectTechnologies, detectProjectName, detectDescription, detectFullDescription, detectUrls, detectTechnologiesFromPom };
