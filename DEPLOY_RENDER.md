# Deploy on Render

## Push to GitHub first

1. Initialize and commit (from the project root):

   ```bash
   git init
   git add .
   git commit -m "Initial commit: campaign workspace + Flask tracking"
   ```

2. Create a **new empty repository** on GitHub (no README/license if you already have them locally).

3. Add the remote and push:

   ```bash
   git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

4. In Render, connect **that** GitHub repo when creating the Blueprint.

---

This repo runs **two** web services:

| Service | Purpose |
|--------|---------|
| **curator-tracking** | Flask — email open/click tracking, dashboard, `/api/stats` |
| **curator-campaign** | Node — campaign UI + SMTP send (`campaign-workspace.html`) |

## Option A — Blueprint (fastest)

1. Push this repo to **GitHub** or **GitLab**.
2. In [Render](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo and select `render.yaml`.
4. Apply the blueprint — Render creates both services.

## After deploy

1. Open the **curator-tracking** service and copy its URL, e.g. `https://curator-tracking.onrender.com`.
2. Open **curator-campaign** → **Environment** → add or edit:
   - `TRACKING_API_URL` = that URL (no trailing slash).
3. Redeploy **curator-campaign** if needed.

Tracking pixels and links use **`PUBLIC_BASE_URL`**, which defaults to **`RENDER_EXTERNAL_URL`** on the Flask service, so no extra env is required for the tracker itself.

4. Open **curator-campaign** URL in the browser → **Email results** → set **Tracking API base URL** to the same Flask URL (or leave default if you set `TRACKING_API_URL` and adjust the UI default in code).

## Database

- Without **PostgreSQL**, Flask uses **SQLite** on disk (fine for tests; data can reset when the instance restarts).
- For persistence: create a **PostgreSQL** instance on Render, attach it, and set **`DATABASE_URL`** on **curator-tracking** (Render injects it; the app already converts `postgres://` to `postgresql://`).

## Cold starts

Free web services **spin down** after idle time. First request after sleep can take ~30–60s.

## Local vs production

- Local: `http://127.0.0.1:5000` for tracking only works for self-tests.
- Production: recipients must load pixels from your **public HTTPS** URL (the Render Flask URL).

---

## “Not live” / site won’t open — checklist

1. **Render dashboard → your service → Logs**  
   Fix any **build** (red) or **runtime** error before expecting a URL to work.

2. **Two services**  
   You need **both** `curator-tracking` (Python) and `curator-campaign` (Node). The **campaign UI** URL is the **Node** service (e.g. `https://curator-campaign.onrender.com`).

3. **Open the right URL**  
   - Campaign app: `https://YOUR-NODE-SERVICE.onrender.com/` → redirects to `campaign-workspace.html`.  
   - Or: `https://YOUR-NODE-SERVICE.onrender.com/campaign-workspace.html`  
   - Tracker dashboard: `https://YOUR-FLASK-SERVICE.onrender.com/dashboard`

4. **Free tier cold start**  
   After ~15 min idle, the first request can take **30–60+ seconds** — wait and refresh once.

5. **Deploy latest code**  
   After pushing to GitHub, open the service → **Manual Deploy → Deploy latest commit** if auto-deploy is off.

6. **Node `TRACKING_API_URL`**  
   Set on the **Node** service to your **Flask** service URL (no trailing slash). Sending still works without it; tracking needs it.

7. **Branch**  
   Render must deploy **`main`** (or change the branch in the service settings).
