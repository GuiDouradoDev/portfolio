# Portfolio

Professional portfolio website with admin panel. Built with Node.js, Express, and SQLite.

## Features

- **Public site** — Projects grid, skills section, contact form, responsive design
- **Admin panel** — Dashboard, project CRUD, skill management, contact messages
- **Project import** — Drag & drop folder upload or local path import with auto-detection of title, description, technologies (Node.js, Java, Python)
- **GitHub integration** — Create repositories directly from the admin panel
- **SQLite database** — Portable, no external database setup required

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: EJS templates, vanilla CSS/JS
- **Database**: SQLite via sql.js
- **Upload**: Multer
- **Auth**: express-session + bcryptjs

## Getting Started

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Server runs at `http://localhost:3000`.

Admin panel: `http://localhost:3000/admin/login`

## Configuration

Create a `.env` file (optional, defaults work out of the box):

```env
SESSION_SECRET=your-secret-key
PORT=3000
```

## Project Structure

```
portfolio/
├── database/          # SQLite DB + initialization
├── public/            # Static assets (CSS, JS)
├── routes/            # Express route handlers
├── scripts/           # Project analyzer, GitHub import
├── views/             # EJS templates
│   ├── admin/         # Admin panel views
│   └── partials/      # Reusable template parts
├── uploads/           # Uploaded images (gitignored)
├── server.js          # App entry point
└── stop.bat           # Quick stop script (port 3000)
```

## License

MIT
