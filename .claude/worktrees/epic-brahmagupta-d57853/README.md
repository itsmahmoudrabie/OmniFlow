# OmniFlow — Shopify + WhatsApp Cloud API Integration

> Turn store visitors into repeat buyers. Manage orders, conversations, abandoned carts, and broadcasts from one glass screen — powered by official WhatsApp Cloud API + Shopify Admin API.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/itsmahmoudrabie/OmniFlow)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/itsmahmoudrabie/OmniFlow)
[![Shopify App](https://img.shields.io/badge/Shopify-App-95BF47?logo=shopify&logoColor=white)](https://shopify.dev)

---

## Features

- **Shopify OAuth** — multi-store install flow, ready for the Shopify App Store
- **WhatsApp Cloud API** — send/receive messages, media, templates, catalog
- **Abandoned-cart recovery** — automated WhatsApp follow-ups on checkout drop-off
- **Unified inbox** — labels, notes, agent assignment, AI-suggested replies
- **AI assistant** — reply suggestions, sentiment, summaries (Gemini / Groq)
- **Broadcasts** — schedule template campaigns to customer segments
- **Automations** — rule-based queues (new order → confirmation, shipped → tracking, …)
- **Shipping integrations** — create AWB & track shipments
- **Loyalty points** — award / track on every purchase
- **Embedded admin UI** — React + Vite + Tailwind, runs inside Shopify Admin

---

## Architecture

```
┌──────────────────────────┐      ┌─────────────────────────────┐
│  Shopify Admin (iframe)  │◀────▶│  React Dashboard (Vite SPA) │
└──────────────────────────┘      └──────────────┬──────────────┘
                                                 │ /api/*
                                                 ▼
┌────────────────────────────────────────────────────────────────┐
│                Node.js / Express server (Railway)              │
│  ┌────────────┐ ┌─────────────┐ ┌───────────────┐ ┌──────────┐ │
│  │ OAuth flow │ │  REST API   │ │ Webhooks      │ │  AI      │ │
│  │ (Shopify)  │ │  (orders…)  │ │ Shopify + WA  │ │  agents  │ │
│  └────────────┘ └─────────────┘ └───────────────┘ └──────────┘ │
└─────────────────────┬────────────────────────────┬─────────────┘
                      │                            │
                      ▼                            ▼
              Shopify Admin API           WhatsApp Cloud API
```

---

## Quick start

### 1. Local development

```bash
git clone https://github.com/YOUR_USERNAME/omniflow.git
cd omniflow
cp .env.example .env        # fill in your keys

npm install                 # installs server + dashboard
npm run build               # builds React app
npm start                   # boots Express on http://localhost:8765
```

### 2. Deploy to Railway

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/omniflow.git
git push -u origin main
```

Then on **railway.app** → New Project → **Deploy from GitHub repo** → select `omniflow`.
Add environment variables (see `.env.example`).
Railway auto-runs `npm install` → `npm run build` → `npm start`.

### 3. Register on Shopify

1. https://partners.shopify.com → **Apps → Create app**
2. **App URL**: your Railway domain
3. **Redirect URL**: `https://YOUR-APP.up.railway.app/auth/callback`
4. Copy **Client ID** → `SHOPIFY_API_KEY` and **Client secret** → `SHOPIFY_API_SECRET` on Railway
5. Install on a dev store: `https://YOUR-APP.up.railway.app/auth?shop=DEV-STORE.myshopify.com`

Detailed walkthrough: see **[SETUP_GUIDE_AR.md](./SETUP_GUIDE_AR.md)** (Arabic).

---

## Environment variables

See [`.env.example`](./.env.example) for the full list. Minimum to boot:

| Variable | Source |
|---|---|
| `SHOPIFY_API_KEY` | Shopify Partners → App → Configuration |
| `SHOPIFY_API_SECRET` | Same as above |
| `SHOPIFY_APP_URL` | Your Railway domain (`https://…up.railway.app`) |
| `META_ACCESS_TOKEN` | Meta for Developers → WhatsApp → API Setup |
| `PHONE_NUMBER_ID` | Same |
| `VERIFY_TOKEN` | Any random string you choose |

---

## Project structure

```
omniflow/
├── dashboard-react/            # React + Vite + Tailwind UI
├── server/                     # Express backend
│   ├── index.js                #   main app
│   ├── shopify-oauth.js        #   OAuth + webhook HMAC
│   └── *.json                  #   local state (gitignored)
├── shopify.app.toml            # Shopify CLI config
├── railway.json                # Railway deploy config
├── nixpacks.toml               # Nixpacks build config
├── Procfile                    # for any Procfile-aware host
└── .github/workflows/          # CI + Railway auto-deploy
```

---

## Endpoints

| Path | Purpose |
|---|---|
| `GET  /auth?shop=…` | Begin Shopify OAuth install |
| `GET  /auth/callback` | OAuth completion |
| `POST /webhooks/shopify/:topic` | Shopify webhooks (HMAC verified) |
| `GET  /webhook` / `POST /webhook` | WhatsApp Cloud API webhook |
| `GET  /api/*` | Dashboard data (orders, inbox, …) |
| `GET  /healthz` | Railway health probe |

---

## License

UNLICENSED — All rights reserved.
