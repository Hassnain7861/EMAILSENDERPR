#!/usr/bin/env node
/**
 * Serves the campaign UI and sends email via Gmail SMTP (app password).
 * Optional: TRACKING_API_URL or per-request trackingApiUrl → Flask prepares tracked HTML
 * so opens/clicks appear in the tracking DB + dashboard.
 *
 * Run: npm install && npm start
 * Open: http://localhost:3847/campaign-workspace.html
 *
 * For full tracking: run Flask in another terminal:
 *   python flask_email_tracking/run.py
 * Set PUBLIC_BASE_URL=http://127.0.0.1:5000 (or your public URL in production).
 */
import cors from 'cors';
import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3847;
const DEFAULT_TRACKING = (process.env.TRACKING_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Ask Flask to create an emails row and return HTML with pixel + tracked links.
 */
async function prepareTrackedHtml(baseUrl, recipient, campaignId, html) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/prepare-message`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient,
      campaign_id: campaignId || null,
      html,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText || 'prepare-message failed');
  }
  return data.html;
}

app.post('/api/send-campaign', async (req, res) => {
  const { auth, messages, from, campaignId, trackingEnabled, trackingApiUrl } = req.body || {};
  if (!auth?.user || !auth?.pass) {
    return res.status(400).json({ error: 'Missing SMTP credentials (user / app password).' });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'No messages to send.' });
  }

  const pass = String(auth.pass).replace(/\s+/g, '');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: auth.user, pass },
  });

  const fromAddr = from || auth.user;
  const results = { sent: 0, failed: [], trackingSkipped: 0 };
  const delayMs = Math.max(800, Math.min(3000, Number(process.env.SEND_DELAY_MS) || 1500));

  const base = (trackingApiUrl || DEFAULT_TRACKING).replace(/\/$/, '');
  const useTracking = trackingEnabled !== false && trackingEnabled !== 'false';

  for (const msg of messages) {
    const to = msg?.to;
    if (!to || typeof to !== 'string') {
      results.failed.push({ to: to || '(missing)', error: 'Invalid recipient' });
      continue;
    }
    let html = msg.html != null ? String(msg.html) : undefined;
    if (useTracking && html) {
      try {
        html = await prepareTrackedHtml(base, to, campaignId || null, html);
      } catch (err) {
        console.warn('[tracking]', err.message || err);
        results.trackingSkipped++;
        // still send original HTML
      }
    }
    try {
      await transporter.sendMail({
        from: `"Campaign" <${fromAddr}>`,
        to,
        subject: String(msg.subject || 'Message'),
        text: msg.text != null ? String(msg.text) : undefined,
        html,
      });
      results.sent++;
    } catch (err) {
      results.failed.push({ to, error: err?.message || String(err) });
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Campaign workspace: http://localhost:${PORT}/campaign-workspace.html`);
  console.log('Send API: POST /api/send-campaign');
  console.log(`Default tracking API: ${DEFAULT_TRACKING} (Flask). Set TRACKING_API_URL to override.`);
});
