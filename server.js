require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ── MODELS ─────────────────────────────────────────────────────
// Donor Model
const donorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, min: 18, max: 65 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  address: String,
  lastDonationDate: Date,
  consent: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Donor = mongoose.model('Donor', donorSchema);

// Blood Request Model
const requestSchema = new mongoose.Schema({
  patientName:    { type: String, required: true },
  bloodGroup:     { type: String, required: true },
  units:          { type: Number, required: true },
  hospital:       { type: String, required: true },
  contactPhone:   { type: String, required: true },
  additionalInfo: { type: String },
  createdAt:      { type: Date, default: Date.now }
});
const Request = mongoose.model('Request', requestSchema);

// Contact Message Model
const contactSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  message:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const ContactMessage = mongoose.model('ContactMessage', contactSchema);

// ── ROUTES ─────────────────────────────────────────────────────
// Donors
app.get('/api/donors', async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/donors', async (req, res) => {
  try {
    const { name, bloodGroup, phone, consent } = req.body;
    if (!name || !bloodGroup || !phone || consent !== true) {
      return res.status(400).json({ error: 'Required fields missing or consent not given' });
    }
    const donor = new Donor(req.body);
    await donor.save();
    res.status(201).json({ message: 'Donor registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Blood Requests
app.get('/api/requests', async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const { patientName, bloodGroup, units, hospital, contactPhone } = req.body;
    if (!patientName || !bloodGroup || !units || !hospital || !contactPhone) {
      return res.status(400).json({ error: 'Please fill all required fields' });
    }
    const request = new Request(req.body);
    await request.save();
    res.status(201).json({ message: 'Blood request saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Contact Messages
app.get('/api/contact', async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Please fill all required fields' });
    }
    const contactMessage = new ContactMessage({ name, email, message });
    await contactMessage.save();
    res.status(201).json({ message: 'Contact message received successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Serve Frontend in Production ──────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
