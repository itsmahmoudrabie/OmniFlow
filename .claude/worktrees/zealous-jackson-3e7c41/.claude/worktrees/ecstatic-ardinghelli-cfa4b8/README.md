# Art Edges Dashboard — React & Node.js Version

This is a modern, high-performance dashboard for managing Shopify orders and automated WhatsApp communication.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion.
- **Backend**: Node.js + Express.js.
- **Integrations**: Shopify Admin API & WhatsApp Cloud API.

## Project Structure
- `/dashboard-react`: The React frontend.
- `/server`: The Node.js backend.

## How to Run

### 1. Start the Backend
```bash
cd server
npm install
npm run dev
```
The server will run on `http://localhost:5000`.

### 2. Start the Frontend
```bash
cd dashboard-react
npm install
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

### 3. Expose the Webhook
To receive WhatsApp messages, you must expose your local server using ngrok:
```bash
ngrok http 5000
```
Then update your **Webhook URL** in the Meta Developer Portal to:
`https://your-ngrok-url.ngrok-free.app/webhook`

## Features
- ✅ **Shopify Integration**: Fetch unfulfilled orders automatically.
- ✅ **WhatsApp Inbox**: Real-time customer message tracking.
- ✅ **Status Tracking**: Visual indicators for "Sent" and "Confirmed" orders.
- ✅ **Modern UI**: Glassmorphism design with RTL support.
- ✅ **Auto-Accept**: Automatic confirmation messages when customers click "Confirm".

## Deployment
This project is ready to be uploaded to **GitHub**. 
- The frontend can be hosted on **Vercel** or **Netlify**.
- The backend can be hosted on **Render**, **Railway**, or a VPS.
