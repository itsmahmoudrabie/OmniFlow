# دليل تشغيل OmniFlow على GitHub + Railway + Shopify

> دليل خطوة بخطوة لربط المشروع بـ GitHub، نشره على Railway، وتحويله لتطبيق Shopify رسمي.

---

## نظرة عامة

المشروع بيتكون من جزأين:
- **`dashboard-react/`** — واجهة React (Vite + Tailwind)
- **`server/`** — Backend بـ Node.js / Express فيه:
  - WhatsApp Cloud API integration
  - Shopify Admin API integration
  - Shopify OAuth (للتثبيت على متاجر متعددة)
  - AI، Automations، Broadcasts، Shipping، Loyalty

كل ده هيشتغل سيرفر واحد على Railway، والـ React هيتبني وقت الـ deploy ويتقدم كـ static files من نفس السيرفر.

---

## الخطوة 1: رفع المشروع على GitHub

### 1.1 — تسجيل دخول جيت

افتح **Git Bash** أو **PowerShell** في مجلد المشروع:

```bash
cd "F:\art-edges-tool\art edges WA"
git config --global user.name "Mahmoud Rabie"
git config --global user.email "itsmahmoudrabie@gmail.com"
```

### 1.2 — إنشاء repo جديد على GitHub

روح على https://github.com/new وأنشئ repo اسمه `omniflow` (أو أي اسم تختاره). **متختارش** "Initialize with README" — هنرفع الكود اللي عندنا.

### 1.3 — رفع الكود

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit: OmniFlow Shopify + WhatsApp integration"
git remote add origin https://github.com/YOUR_USERNAME/omniflow.git
git push -u origin main
```

استبدل `YOUR_USERNAME` باسمك على GitHub.

> ✅ **الـ `.gitignore` بتاعنا بيمنع رفع:** `node_modules`، `.env`، `shops.json`، `inbox.json`، وأي ملفات state فيها بيانات عملاء أو tokens.

---

## الخطوة 2: نشر المشروع على Railway

### 2.1 — إنشاء حساب وربط GitHub

روح على https://railway.app → سجل دخول بـ GitHub.

### 2.2 — إنشاء project جديد

1. اضغط **New Project**
2. اختر **Deploy from GitHub repo**
3. اختر repo اسمه `omniflow`
4. Railway هيقرأ تلقائياً ملفات:
   - `railway.json`
   - `nixpacks.toml`
   - `package.json`

### 2.3 — إضافة متغيرات البيئة

من الـ project → **Variables** → اضغط **Raw Editor** والصق التالي (عدّل القيم):

```env
NODE_ENV=production
PORT=8765

# Shopify (هنحطها بعد إنشاء التطبيق في الخطوة 3)
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_APP_URL=https://YOUR-PROJECT.up.railway.app
SHOPIFY_SCOPES=read_products,read_orders,write_orders,read_customers,read_inventory,read_fulfillments,write_fulfillments

# WhatsApp Cloud API (من Meta for Developers)
META_ACCESS_TOKEN=
PHONE_NUMBER_ID=
VERIFY_TOKEN=omniflow-verify-9k3xL2pQ
CATALOG_ID=
BUSINESS_NAME=OmniFlow

# AI (اختياري)
GEMINI_API_KEY=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

# Cookies
COOKIE_SECRET=aRandom32CharStringChangeMeNow
```

### 2.4 — توليد رابط عام (Domain)

1. من الـ project → **Settings → Networking → Generate Domain**
2. Railway هيدّيك رابط زي: `https://omniflow-production.up.railway.app`
3. ارجع لـ Variables وعدّل `SHOPIFY_APP_URL` بالرابط ده

### 2.5 — أول deploy

Railway هيعمل deploy تلقائياً بعد كل push للـ `main` branch.

تابع اللوج من تاب **Deployments**. لو فيه أي خطأ، اضغط على آخر deployment وشوف اللوج.

تأكد إن الـ health check شغّال:
```
https://YOUR-PROJECT.up.railway.app/healthz
```
لازم يرجّع:
```json
{ "ok": true, "service": "omniflow", "ts": 1234567890 }
```

---

## الخطوة 3: إنشاء تطبيق Shopify

### 3.1 — حساب Shopify Partners

روح على https://partners.shopify.com → **Sign up** أو **Log in**.

### 3.2 — إنشاء التطبيق

1. **Apps → Create app → Create app manually**
2. **App name**: `OmniFlow`
3. **App URL**: `https://YOUR-PROJECT.up.railway.app`
4. **Allowed redirection URLs** (أضفهم سطر سطر):
   ```
   https://YOUR-PROJECT.up.railway.app/auth/callback
   https://YOUR-PROJECT.up.railway.app/auth/shopify/callback
   ```

### 3.3 — نسخ المفاتيح

من **Configuration**:
- **Client ID** → انسخه إلى Railway → `SHOPIFY_API_KEY`
- **Client secret** → انسخه إلى Railway → `SHOPIFY_API_SECRET`

اضغط **Save** في Railway — هيعمل redeploy تلقائي.

### 3.4 — إضافة الـ Scopes

في Shopify Partners → **Configuration → App scopes**:

```
read_products
read_orders
write_orders
read_customers
read_inventory
read_fulfillments
write_fulfillments
read_checkouts
```

(أو افتح `shopify.app.toml` عندنا — كل ده مكتوب فيه ومتزامن مع الـ Shopify CLI لو حابب تستخدمها).

### 3.5 — إعداد الـ Webhooks (اختياري — التطبيق بيعملهم تلقائي بعد التثبيت)

التطبيق يسجل الـ webhooks لما المتجر يثبّت التطبيق (من ملف `shopify-oauth.js` → دالة `registerWebhooks`). لو عايز تتأكد يدوياً:

- `orders/create`, `orders/updated`, `orders/fulfilled`, `orders/cancelled`
- `checkouts/create`, `checkouts/update`
- `customers/create`
- `app/uninstalled`
- **GDPR (إجباري)**: `customers/data_request`, `customers/redact`, `shop/redact`

---

## الخطوة 4: إنشاء WhatsApp Business App (Meta)

### 4.1 — Meta for Developers

1. روح على https://developers.facebook.com → **My Apps → Create App**
2. اختر **Business → WhatsApp**
3. اضبط الـ API:
   - **Phone Number ID** → انسخه لـ `PHONE_NUMBER_ID`
   - **System User Access Token** (دائم) → `META_ACCESS_TOKEN`
   - **Catalog ID** (لو هتستخدم WhatsApp Catalog) → `CATALOG_ID`

### 4.2 — تكوين الـ Webhook

في Meta → WhatsApp → **Configuration → Webhook**:
- **Callback URL**: `https://YOUR-PROJECT.up.railway.app/webhook`
- **Verify Token**: نفس القيمة في `VERIFY_TOKEN` على Railway

اشترك على الـ events:
- `messages`
- `message_status`
- `message_template_status_update`

---

## الخطوة 5: تثبيت التطبيق على متجر تجريبي

### 5.1 — إنشاء Development Store

في Shopify Partners → **Stores → Add store → Development store** → اختر **Create store to test and build**.

### 5.2 — تثبيت OmniFlow

افتح في المتصفح:
```
https://YOUR-PROJECT.up.railway.app/auth?shop=YOUR-DEV-STORE.myshopify.com
```

هيحوّلك على صفحة موافقة من Shopify → اضغط **Install app** → التطبيق يفتح جوة Shopify Admin.

✅ **مبروك! التطبيق دلوقتي شغّال على متجرك**.

---

## الخطوة 6: تجهيز التطبيق للـ App Store (اختياري)

لما تكون عايز تنشره للعموم على Shopify App Store:

1. Shopify Partners → **Apps → OmniFlow → Distribution**
2. اختر **App Store → Get Started**
3. املأ:
   - App listing (screenshots، description، video)
   - Privacy policy URL
   - Support email
   - Pricing model
4. Submit للـ review (بياخد 5–10 أيام)

التطبيق هيكون جاهز من ناحية الـ compliance لأن:
- ✅ بنستخدم OAuth (مش API keys ثابتة)
- ✅ بنتحقق من HMAC في كل webhook
- ✅ بنرد على GDPR webhooks تلقائياً (`customers/data_request`, `customers/redact`, `shop/redact`)
- ✅ بنشيل البيانات لما المتجر يلغي التثبيت (`app/uninstalled`)

---

## الخطوة 7: التطوير المحلي

### 7.1 — تشغيل السيرفر محلياً

```bash
cd "F:\art-edges-tool\art edges WA"
npm install
cp .env.example .env
# عدّل .env بالقيم بتاعتك
npm run build
npm start
```

السيرفر هيشتغل على http://localhost:8765.

### 7.2 — تشغيل الـ frontend في dev mode (HMR)

في terminal تاني:
```bash
cd dashboard-react
npm run dev
```

هيشتغل على http://localhost:5173 ومتصل بـ backend على :8765.

### 7.3 — اختبار Shopify OAuth محلياً (مع ngrok)

Shopify بيحتاج HTTPS public URL. استخدم **ngrok**:

```bash
ngrok http 8765
```

ياخد الرابط (`https://abc123.ngrok.io`) وحطه كـ:
- `SHOPIFY_APP_URL` في `.env`
- **App URL** و **Redirect URL** في Shopify Partners

---

## استكشاف الأخطاء (Troubleshooting)

| المشكلة | الحل |
|---|---|
| Railway deploy فشل | اشوف اللوج في Deployments → غالباً مشكلة في `node_modules` أو env vars |
| `/healthz` بيرجع 404 | السيرفر مش شغّال — اشوف Logs في Railway |
| Shopify OAuth `Invalid HMAC` | تأكد إن `SHOPIFY_API_SECRET` صحيح ومحدّث |
| WhatsApp webhook مش بيستقبل | تأكد من `VERIFY_TOKEN` وإن Meta verified الـ callback URL |
| React build فشل | شيل `dashboard-react/node_modules` وامسح `package-lock.json` وأعد `npm install` |
| App Store rejection | معظم الرفض بسبب: غياب privacy policy أو GDPR webhooks — كله موجود في الكود بتاعنا |

---

## كوماند سريعة

```bash
# مزامنة آخر تغييرات
git pull
npm install
npm run build
npm start

# الـ commit و push (أي تغيير بترفعه على main بيتنشر تلقائياً على Railway)
git add .
git commit -m "feat: add new feature"
git push

# عرض لوج Railway من الـ CLI (لو ثبّت @railway/cli)
railway logs

# مزامنة config Shopify (لو مستخدم Shopify CLI)
npm install -g @shopify/cli @shopify/theme
shopify app config link
shopify app deploy
```

---

## الـ Endpoints الرئيسية

| الـ Path | الوظيفة |
|---|---|
| `GET  /auth?shop=…` | بدء تثبيت Shopify OAuth |
| `GET  /auth/callback` | استكمال الـ OAuth |
| `POST /webhooks/shopify/:topic` | استقبال Shopify webhooks (HMAC verified) |
| `GET  /webhook` + `POST /webhook` | WhatsApp Cloud API webhook |
| `GET  /api/orders` | قائمة الطلبات |
| `GET  /api/inbox` | المحادثات |
| `POST /api/whatsapp/send` | إرسال رسالة واتساب |
| `GET  /api/analytics` | إحصائيات |
| `GET  /api/shopify/connection` | حالة الاتصال بـ Shopify |
| `GET  /healthz` | فحص حالة السيرفر (Railway) |

---

## أي سؤال؟

- وثائق Shopify: https://shopify.dev/docs/apps
- وثائق Railway: https://docs.railway.app
- وثائق WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
