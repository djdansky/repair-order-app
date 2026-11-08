# Repair Order Web App

A simple web application that generates a QR code. Scanning it opens a form to report a repair order (problem, date, location, pictures). Submissions are saved to a list and optionally emailed to you.

## Features
- QR code linking to the form
- Form with image upload and preview
- Repair list view
- Email notifications (configurable)
- Local JSON storage for orders and uploaded images

## Setup & Run

1. Make sure you have Node.js installed.
2. In this folder, run:
   ```bash
   npm install
   npm start
   ```
3. Open http://localhost:3000 in your browser.
4. The QR code will point to your form (on localhost it will only work locally).

## Configuration

### Email Notifications
Set environment variables before starting:

```bash
export EMAIL_USER="your-gmail@gmail.com"
export EMAIL_PASS="your-app-password"   # For Gmail, use an App Password
export NOTIFY_EMAIL="your-email@example.com"  # Where to send notifications
npm start
```

Or edit `server.js` and fill in the `emailConfig` and `notifyTo` values.

### SMS (Optional)
To add SMS via Twilio:
1. `npm install twilio`
2. Uncomment and implement the SMS section in `server.js` using your Twilio credentials (env vars recommended).

## Deployment
For real use (so QR codes work from any phone):
- Deploy to a free/cheap host like Render, Railway, Fly.io, or a VPS.
- Update the app to use the public URL.
- Use a proper database (e.g. SQLite or Postgres) instead of the JSON file for production.
- Add authentication to the list page if needed.

## Files
- `server.js` - Backend (Express)
- `public/` - Frontend pages and CSS
- `data/repairs.json` - Stored orders (created automatically)
- `public/uploads/` - Uploaded images

Enjoy! Scan the QR, submit a test order, and check the list.