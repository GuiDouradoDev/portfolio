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
- **Banco SQLite** — Portátil, sem necessidade de configurar banco externo

## Tecnologias

- **Backend**: Node.js, Express
- **Frontend**: EJS templates, CSS/JS puro
- **Banco**: SQLite via sql.js
- **Upload**: Multer
- **Autenticação**: express-session + bcryptjs

## Como usar

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start
```

Servidor em `http://localhost:3000`.

Painel admin: `http://localhost:3000/admin/login` (login: `admin` / `admin123`)

## Configuração

Crie um arquivo `.env` (opcional, valores padrão já funcionam):

```env
SESSION_SECRET=sua-chave-secreta
PORT=3000
```

No painel admin em **Configurações**, é possível personalizar:
- Título, subtítulo e descrição do site
- Links de redes sociais (GitHub, LinkedIn, WhatsApp)
- Textos dos botões e seções
- URLs para SEO (`site_url`, `site_image`)

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
