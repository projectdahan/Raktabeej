if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// Middleware
const corsOptions = {
    origin: "https://your-frontend-service.com", // Replace with your frontend URL
    methods: "GET,POST",
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Basic route to confirm backend is running
app.get('/', (req, res) => {
    res.send("Backend is running! Use API routes like /api/donors");
});

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.error("❌ MONGO_URI is missing. Make sure it's set in Render.");
    process.exit(1);
}

mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
}).then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      process.exit(1);
  });

/* ── MODEL DEFINITIONS ───────────────────────────────────────── */

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
    createdAt: { type: Date, default: Date.now },
});
const Donor = mongoose.model('Donor', donorSchema);

// Blood Request Model
const requestSchema = new mongoose.Schema({
    patientName: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    units: { type: Number, required: true },
    hospital: { type: String, required: true },
    contactPhone: { type: String, required: true },
    additionalInfo: { type: String },
    createdAt: { type: Date, default: Date.now },
});
const Request = mongoose.model('Request', requestSchema);

// Contact Message Model
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
const ContactMessage = mongoose.model('ContactMessage', contactSchema);

/* ── ROUTE DEFINITIONS ───────────────────────────────────────── */

// Donors Routes
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

// Blood Requests Routes
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

// Contact Messages Routes
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

/* ── START SERVER ───────────────────────────────────────────── */

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
