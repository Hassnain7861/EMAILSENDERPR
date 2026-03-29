# Curator — campaign workspace + email tracking

Bulk campaign UI (Node/Express) with optional **open/click tracking** (Flask). Send via Gmail SMTP (app password); tracking uses a pixel + wrapped links.

## Repository layout

| Path | Description |
|------|-------------|
| `public/campaign-workspace.html` | Main SPA (templates, leads, send) |
| `server.mjs` | Express: static files + `POST /api/send-campaign` |
| `flask_email_tracking/` | Flask app: `/track/*`, `/dashboard`, `/api/stats`, `POST /api/prepare-message` |
| `render.yaml` | **Render Blueprint** — deploys two web services |
| `wsgi.py` | Gunicorn entry for production |

## Local development

**Terminal 1 — tracking (Flask)**

```bash
pip install -r requirements-render.txt
# Windows PowerShell:
$env:PYTHONPATH = (Get-Location).Path
python flask_email_tracking/run.py
```

Opens `http://127.0.0.1:5000` (dashboard at `/dashboard`, health at `/api/health`).

**Terminal 2 — campaign UI + send (Node)**

```bash
npm install
npm start
```

Opens `http://localhost:3847/campaign-workspace.html`.

For real open/click data, recipients must load your **public** tracking URL (see [DEPLOY_RENDER.md](DEPLOY_RENDER.md)).

## Deploy on Render

See **[DEPLOY_RENDER.md](DEPLOY_RENDER.md)** for the full checklist.

**Short version:**

1. Push this repo to **GitHub**.
2. In [Render](https://dashboard.render.com): **New → Blueprint** → connect the repo → use **`render.yaml`**.
3. After deploy, set **`TRACKING_API_URL`** on the **Node** service to the **Flask** service URL (no trailing slash).
4. Use the **Node** service URL as your public campaign app; use the **Flask** URL in the UI under **Email results → Tracking API base URL** if needed.

## Environment variables

| Variable | Service | Purpose |
|----------|-----------|---------|
| `TRACKING_API_URL` | Node | Base URL of Flask tracker for `prepare-message` |
| `DATABASE_URL` | Flask | PostgreSQL on Render (optional; defaults to SQLite) |
| `PUBLIC_BASE_URL` | Flask | Override for tracking links; else `RENDER_EXTERNAL_URL` on Render |
| `SECRET_KEY` | Flask | Set in production (`render.yaml` can generate one) |

Copy **`.env.example`** to `.env` only for local experiments; do not commit `.env`.

## Git notes

- Default branch is **`main`**. Set your name/email before future commits:

  `git config user.email "you@users.noreply.github.com"`  
  `git config user.name "Your Name"`

- The **`default/`** folder is in `.gitignore` (local scratch). Delete that ignore rule if you want it tracked.

## License

Private / your project — add a `LICENSE` file if you open-source this repo.
