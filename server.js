const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dataFile = path.join(dataDir, 'repairs.json');
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]');

// Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load/save repairs
function getRepairs() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}
function saveRepairs(repairs) {
  fs.writeFileSync(dataFile, JSON.stringify(repairs, null, 2));
}

// Email config - user must set these in environment or edit below
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'david@ddansky.com',
    pass: process.env.EMAIL_PASS || '1Foster1'
  }
};
const notifyTo = process.env.NOTIFY_EMAIL || 'daviddansky@cox.net';

// Optional SMS via Twilio - set env vars if desired
// const twilio = require('twilio'); // uncomment and npm install twilio if using

app.get('/api/repairs', (req, res) => {
  res.json(getRepairs());
});

app.post('/api/submit', upload.array('pictures', 10), async (req, res) => {
  try {
    const { problem, date, location } = req.body;
    if (!problem || !date || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pictures = (req.files || []).map(f => '/uploads/' + f.filename);

    const repair = {
      id: Date.now().toString(),
      problem,
      date,
      location,
      pictures,
      submittedAt: new Date().toISOString()
    };

    const repairs = getRepairs();
    repairs.unshift(repair);
    saveRepairs(repairs);

    // Send notification email
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      const transporter = nodemailer.createTransport(emailConfig);
      const mailOptions = {
        from: emailConfig.auth.user,
        to: notifyTo,
        subject: `New Repair Order: ${location}`,
        html: `
          <h2>New Repair Order</h2>
          <p><strong>Problem:</strong> ${problem}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Pictures:</strong> ${pictures.length} attached</p>
          <p>View all repairs at: ${req.protocol}://${req.get('host')}/list.html</p>
        `
      };
      await transporter.sendMail(mailOptions);
    } else {
      console.log('Email not configured. Repair saved:', repair.id);
    }

    // TODO: Add SMS if Twilio configured
    // Example: if (process.env.TWILIO_SID) { ... }

    res.json({ success: true, id: repair.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate QR code for the form
app.get('/api/qr', async (req, res) => {
  const formUrl = `${req.protocol}://${req.get('host')}/form.html`;
  try {
    const qr = await QRCode.toDataURL(formUrl);
    res.json({ qr, url: formUrl });
  } catch (err) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Repair Order App running at http://localhost:${PORT}`);
  console.log(`Form URL: http://localhost:${PORT}/form.html`);
  console.log(`List: http://localhost:${PORT}/list.html`);
});