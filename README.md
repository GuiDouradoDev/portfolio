# Portfolio

Site de portfólio profissional com painel administrativo. Construído com Node.js, Express e SQLite.

## Funcionalidades

- **Site público** — Design moderno com cards em glassmorphism, animações de entrada, gradientes, orbes animadas no hero, grid decorativo
- **Tema claro/escuro** — Alternador com animação suave e persistência em localStorage
- **Painel admin** — Dashboard, CRUD de projetos, gerenciamento de habilidades, mensagens de contato
- **Importação de projetos** — Upload de pasta via drag & drop ou caminho local com detecção automática de título, descrição e tecnologias (Node.js, Java, Python)
- **Integração GitHub** — Crie repositórios diretamente do painel admin
- **SEO / Open Graph** — Meta tags OG e Twitter Card para compartilhamento em redes sociais
- **Responsivo** — Layout adaptável para mobile, tablet e desktop
- **Animações** — Scroll reveal com fade, scale e direção, efeitos hover com glow e shine, barras animadas, stagger delays
- **Micro-interações** — Navbar com underline animado, botões com efeito shine, cards com glow gradiente, avatar flutuante com glow pulsante
- **Performance** — CSS puro sem frameworks, IntersectionObserver para lazy reveal, scrollbar customizada
- **Segurança** — Headers HTTP (Helmet), rate limiting no login, proteção contra path traversal, cookie httpOnly+sameSite, sessões limpas na inicialização
- **Banco SQLite** — Portátil, sem necessidade de configurar banco externo

## Tecnologias

- **Backend**: Node.js, Express
- **Frontend**: EJS templates, CSS/JS puro
- **Banco**: SQLite via sql.js
- **Upload**: Multer
- **Autenticação**: express-session + bcryptjs
- **Segurança**: Helmet, express-rate-limit

## Como usar

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start
```

Servidor em `http://localhost:3000`.

Painel admin: `http://localhost:3000/admin/login`

## Configuração

> **Importante**: Altere a senha padrão (`admin` / `admin123`) e o `SESSION_SECRET` antes de usar em produção.

Crie um arquivo `.env`:

```env
SESSION_SECRET=uma-chave-forte-e-aleatoria
PORT=3000
```

No painel admin em **Configurações**, é possível personalizar:
- Título, subtítulo e descrição do site
- Links de redes sociais (GitHub, LinkedIn, WhatsApp)
- Textos dos botões e seções
- URLs para SEO (`site_url`, `site_image`)

## Segurança

- **Headers protegidos** via Helmet (X-Content-Type-Options, X-Frame-Options, etc.)
- **Rate limiting** na rota de login (10 tentativas a cada 15 minutos)
- **Cookie de sessão** configurado com `httpOnly` e `sameSite: 'lax'`
- **Path traversal** prevenido na importação de projetos (sanitização de caminhos)
- **Sessões expiradas** são limpas automaticamente na inicialização do servidor
- **Consultas parametrizadas** (SQL injection prevenido)
- **Templates escapados** (EJS usa `<%= %>` que escapa HTML por padrão)
- **Error handler** global sem expor detalhes internos
- **Logs** não exibem credenciais ou consultas SQL completas
- **`.env` e `node_modules`** ignorados pelo Git

## Estrutura

```
portfolio/
├── database/          # Banco SQLite + inicialização
├── public/            # Assets estáticos (CSS, JS)
├── routes/            # Handlers de rotas Express
├── scripts/           # Analisador de projetos, importação GitHub
├── views/             # Templates EJS
│   ├── admin/         # Views do painel admin
│   └── partials/      # Componentes reutilizáveis
├── uploads/           # Imagens enviadas (gitignorado)
├── .env               # Variáveis de ambiente (gitignorado)
├── server.js          # Entry point da aplicação
├── stop.bat           # Script para parar o servidor (porta 3000)
└── start.bat          # Script para iniciar o servidor
```

## Licença

MIT
