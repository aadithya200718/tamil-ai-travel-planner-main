require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');

const rateLimit = require('express-rate-limit');

const { getDb } = require('./db');
const { getTravelOptions } = require('./services/travelService');
const { generateItinerary } = require('./services/itineraryService');
const { forwardToWhisper } = require('./services/audioService');
const { createBooking, getBooking, cancelBooking, getAllBookings } = require('./services/bookingService');
const { registerUser, loginUser, verifyToken, getUserById, initUsersTable } = require('./services/authService');

const app = express();
const PORT = process.env.PORT || 3001;
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:5000';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize users table on startup
try { initUsersTable(); } catch (_) {}

// Rate limiting — applied directly on individual routes below
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Multer for audio file uploads
const upload = multer({ storage: multer.memoryStorage() });

// ─── Helper: Call NLP service ────────────────────────────────────────────────
async function callNlpService(text) {
  try {
    const response = await axios.post(`${NLP_SERVICE_URL}/nlp`, { text }, { timeout: 10000 });
    return response.data;
  } catch (err) {
    console.error('NLP service error:', err.message);
    // Fallback NLP result
    return {
      intent: 'plan_trip',
      entities: { source: '', destination: '', date: '', budget: '' },
    };
  }
}

// ─── Helper: Process a text query end-to-end ─────────────────────────────────
async function processQuery(transcript) {
  const db = await getDb();

  // 1. Call NLP service
  const nlpResult = await callNlpService(transcript);
  const { intent, entities } = nlpResult;

  // 2. Save query to DB
  const queryRow = await db.query(
    'INSERT INTO queries (transcript, intent, entities) VALUES ($1, $2, $3) RETURNING id',
    [transcript, intent, JSON.stringify(entities)]
  );
  const queryId = queryRow.rows[0].id;

  // 3. Generate travel options + itinerary
  const travelOptions = getTravelOptions(
    entities.source,
    entities.destination,
    entities.budget
  );
  const itineraryText = generateItinerary(nlpResult, travelOptions);

  // 4. Save itinerary to DB
  const itineraryRow = await db.query(
    'INSERT INTO itineraries (query_id, itinerary_text, travel_options) VALUES ($1, $2, $3) RETURNING id',
    [queryId, itineraryText, JSON.stringify(travelOptions)]
  );

  return {
    queryId,
    itineraryId: itineraryRow.rows[0].id,
    transcript,
    intent,
    entities,
    itinerary: itineraryText,
    travelOptions,
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// ─── Auth Routes ─────────────────────────────────────────────────────────────

// POST /auth/register — Register a new user
app.post('/auth/register', apiLimiter, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'பெயர், மின்னஞ்சல் மற்றும் கடவுச்சொல் தேவை',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        error: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்',
      });
    }
    const result = await registerUser({ name, email, phone, password });
    res.json({
      success: true,
      message: 'பதிவு வெற்றிகரமாக முடிந்தது! 🎉',
      user: result,
    });
  } catch (err) {
    console.error('POST /auth/register error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// POST /auth/login — Login an existing user
app.post('/auth/login', apiLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: 'மின்னஞ்சல் மற்றும் கடவுச்சொல் தேவை',
      });
    }
    const result = await loginUser({ email, password });
    res.json({
      success: true,
      message: 'உள்நுழைவு வெற்றிகரமாக முடிந்தது! 🎉',
      user: result,
    });
  } catch (err) {
    console.error('POST /auth/login error:', err.message);
    res.status(401).json({ error: err.message });
  }
});

// GET /auth/me — Get current user profile (requires token)
app.get('/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'அங்கீகார டோக்கன் தேவை' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'செல்லாத டோக்கன்' });
    }
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'பயனர் கிடைக்கவில்லை' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('GET /auth/me error:', err);
    res.status(500).json({ error: 'பயனர் விவரங்களை பெற இயலவில்லை' });
  }
});

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /recent — last 10 queries with their itineraries
app.get('/recent', apiLimiter, async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.query(`
      SELECT
        q.id AS query_id,
        q.transcript,
        q.intent,
        q.entities,
        q.created_at,
        i.id AS itinerary_id,
        i.itinerary_text,
        i.travel_options
      FROM queries q
      LEFT JOIN itineraries i ON i.query_id = q.id
      ORDER BY q.created_at DESC
      LIMIT 10
    `);

    const results = rows.rows.map(row => ({
      queryId: row.query_id,
      transcript: row.transcript,
      intent: row.intent,
      entities: safeParseJson(row.entities),
      createdAt: row.created_at,
      itineraryId: row.itinerary_id,
      itinerary: row.itinerary_text,
      travelOptions: safeParseJson(row.travel_options),
    }));

    res.json(results);
  } catch (err) {
    console.error('GET /recent error:', err);
    res.status(500).json({ error: 'Failed to fetch recent queries' });
  }
});

// POST /query — accepts text, runs NLP + itinerary generation
app.post('/query', apiLimiter, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'text field is required and must be a non-empty string' });
    }

    const result = await processQuery(text.trim());
    res.json(result);
  } catch (err) {
    console.error('POST /query error:', err);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// POST /voice — voice transcription via Whisper + itinerary generation
app.post('/voice', apiLimiter, upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'audio file is required (multipart field: audio)' });
  }

  try {
    console.log(`[/voice] Received audio: ${req.file.size} bytes, ${req.file.originalname || 'recording.webm'}`);

    // 1. Forward audio to Flask Whisper service
    const transcription = await forwardToWhisper(
      req.file.buffer,
      req.file.originalname || 'recording.webm'
    );

    console.log(`[/voice] Transcription: "${transcription.text}"`);

    // 2. Process the transcribed text through NLP + itinerary pipeline
    const result = await processQuery(transcription.text);

    // 3. Return combined result
    res.json({
      ...result,
      transcriptionInfo: {
        language: transcription.language,
        confidence: transcription.confidence,
        duration: transcription.duration,
      },
    });
  } catch (err) {
    console.error('POST /voice error:', err.message);
    res.status(500).json({
      error: err.message || 'குரல் அங்கீகாரம் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.',
    });
  }
});

// ─── Booking Routes ──────────────────────────────────────────────────────────

// POST /book — Create a booking
app.post('/book', apiLimiter, async (req, res) => {
  try {
    const { travelOption, passengers, contactPhone, source, destination, travelDate } = req.body;

    if (!travelOption || !passengers || !contactPhone) {
      return res.status(400).json({
        error: 'travelOption, passengers, contactPhone ஆகியவை தேவை',
      });
    }

    const booking = await createBooking({
      travelOption,
      passengers: parseInt(passengers, 10),
      contactPhone,
      source,
      destination,
      travelDate,
    });

    res.json({
      success: true,
      booking,
      message: 'உங்கள் பயணம் உறுதி செய்யப்பட்டது!',
      messageTamil: `பதிவு எண்: ${booking.bookingId} | PNR: ${booking.pnr} | மொத்தம்: ₹${booking.totalPrice}`,
    });
  } catch (err) {
    console.error('POST /book error:', err.message);
    res.status(400).json({ error: err.message || 'பதிவு தோல்வியடைந்தது, மீண்டும் முயற்சிக்கவும்' });
  }
});

// GET /booking/:id — Get booking details
app.get('/booking/:id', apiLimiter, async (req, res) => {
  try {
    const booking = await getBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'பதிவு கிடைக்கவில்லை' });
    }
    res.json(booking);
  } catch (err) {
    console.error('GET /booking error:', err);
    res.status(500).json({ error: 'பதிவு விவரங்களை பெற இயலவில்லை' });
  }
});

// POST /booking/:id/cancel — Cancel a booking (conditional refund)
app.post('/booking/:id/cancel', apiLimiter, async (req, res) => {
  try {
    const result = await cancelBooking(req.params.id);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
      });
    }
    res.json(result);
  } catch (err) {
    console.error('POST /booking/cancel error:', err);
    res.status(500).json({ error: 'ரத்து செய்ய இயலவில்லை' });
  }
});

// GET /bookings — Get all bookings
app.get('/bookings', apiLimiter, async (req, res) => {
  try {
    const bookings = await getAllBookings();
    res.json(bookings);
  } catch (err) {
    console.error('GET /bookings error:', err);
    res.status(500).json({ error: 'பதிவுகளை பெற இயலவில்லை' });
  }
});

// ─── Utility ─────────────────────────────────────────────────────────────────
function safeParseJson(str) {
  try { return str ? JSON.parse(str) : null; } catch (_) { return str; }
}

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Tamil AI Travel Planner backend running on port ${PORT}`);
});

module.exports = app;
