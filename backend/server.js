require('./loadEnv');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');

const rateLimit = require('express-rate-limit');

const { getDb, supabase } = require('./db');
const { getTravelOptions } = require('./services/travelService');
const { getRealTravelOptions } = require('./services/realTravelService');
const { generateItinerary } = require('./services/itineraryService');
const { forwardToWhisper } = require('./services/audioService');
const { findRelevantRoutes, normalizeTravelMode } = require('./services/routeService');
const {
  createBooking,
  getBooking,
  updateBookingPayment,
  cancelBooking,
  getAllBookings,
} = require('./services/bookingService');
const {
  registerUser,
  loginUser,
  verifyToken,
  getUserById,
  getUserByEmail,
  updateUserPassword,
  initUsersTable,
} = require('./services/authService');
const { sendPasswordResetOtp, verifyPasswordResetOtp } = require('./services/passwordResetService');
const {
  createPaymentOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  initiateRefund,
} = require('./services/razorpayService');
const { translateEntities } = require('./services/translationService');

const app = express();
const PORT = process.env.PORT || 3001;
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:5000';
const LEGACY_SCHEMA_ENABLED = process.env.ENABLE_LEGACY_SCHEMA !== 'false';

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

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'OTP கோரிக்கைகள் அதிகமாக உள்ளன. சிறிது நேரம் கழித்து முயற்சிக்கவும்.' },
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
function extractRequestedMode(mode, transcript = '') {
  const normalizedMode = normalizeTravelMode(mode);
  if (normalizedMode !== 'all') {
    return normalizedMode;
  }

  const lowerTranscript = String(transcript || '').toLowerCase();
  if (lowerTranscript.includes('bus') || lowerTranscript.includes('பேருந்து')) return 'bus';
  if (lowerTranscript.includes('train') || lowerTranscript.includes('ரயில்')) return 'train';
  if (lowerTranscript.includes('flight') || lowerTranscript.includes('விமான')) return 'flight';
  if (lowerTranscript.includes('hotel') || lowerTranscript.includes('விடுதி')) return 'hotel';
  return 'all';
}

async function processQuery(transcript, requestedMode = '') {
  const db = await getDb();

  // Early same-city detection at text level
  const sameCityMatch = transcript.match(/\b(\w+)\s+(?:to|from|முதல்|இருந்து)\s+\1\b/i);
  if (sameCityMatch) {
    const city = sameCityMatch[1];
    return {
      transcript,
      intent: 'plan_trip',
      mode: requestedMode || 'all',
      error: true,
      errorMessage: `"${city}" இருந்து "${city}" க்கு பயணம் தேட முடியாது. புறப்படும் இடமும் சேரும் இடமும் வேறுபட்டதாக இருக்க வேண்டும்.`,
      entities: { source: city, destination: city },
      itinerary: `பிழை: புறப்படும் இடமும் சேரும் இடமும் ஒன்றாக இருக்கிறது (${city}). வேறு நகரங்களை கொடுக்கவும்.`,
      routeResults: { totalMatches: 0, bus: [], train: [], hotels: [] },
      travelOptions: { source: city, destination: city, options: { bus: [], train: [], flight: [] } },
    };
  }

  const nlpResult = await callNlpService(transcript);
  const { intent, entities } = nlpResult;
  let resolvedMode = extractRequestedMode(requestedMode, transcript);

  // Auto-detect hotel mode from NLP intent
  if (intent === 'find_hotel' && resolvedMode === 'all') {
    resolvedMode = 'hotel';
  }

  let queryId = null;
  if (LEGACY_SCHEMA_ENABLED) {
    const queryRow = await db.query(
      'INSERT INTO queries (transcript, intent, entities) VALUES ($1, $2, $3) RETURNING id',
      [transcript, intent, JSON.stringify(entities)]
    );
    queryId = queryRow.rows[0].id;
  }

  const routeLookup = await findRelevantRoutes({
    mode: resolvedMode,
    entities,
  });

  // Same-city error
  if (routeLookup.error) {
    return {
      queryId,
      transcript,
      intent,
      mode: routeLookup.requestedMode,
      entities: routeLookup.entities,
      error: true,
      errorMessage: routeLookup.errorMessage,
      itinerary: routeLookup.itinerary,
      routeResults: routeLookup.routeResults,
      travelOptions: routeLookup.travelOptions,
    };
  }

  if (routeLookup.shouldUseDatabase) {
    let itineraryId = null;
    if (LEGACY_SCHEMA_ENABLED && queryId) {
      const itineraryRow = await db.query(
        'INSERT INTO itineraries (query_id, itinerary_text, travel_options) VALUES ($1, $2, $3) RETURNING id',
        [queryId, routeLookup.itinerary, JSON.stringify(routeLookup.routeResults)]
      );
      itineraryId = itineraryRow.rows[0].id;
    }

    return {
      queryId,
      itineraryId,
      transcript,
      intent,
      mode: routeLookup.requestedMode,
      entities: routeLookup.entities,
      itinerary: routeLookup.itinerary,
      routeResults: routeLookup.routeResults,
      travelOptions: routeLookup.travelOptions,
      disableBooking: true,
    };
  }

  const translatedEntities = translateEntities(entities);
  let travelOptions = await getRealTravelOptions(
    translatedEntities.source,
    translatedEntities.destination,
    translatedEntities.budget || 'medium'
  );

  if (
    !travelOptions ||
    (travelOptions.flightOptions &&
      travelOptions.flightOptions.length === 0 &&
      travelOptions.trainOptions &&
      travelOptions.trainOptions.length === 0) ||
    (!travelOptions.flightOptions && !travelOptions.trainOptions)
  ) {
    console.log('Falling back to MOCK data.');
    travelOptions = getTravelOptions(
      translatedEntities.source,
      translatedEntities.destination,
      translatedEntities.budget
    );
  }

  const itineraryText = generateItinerary(nlpResult, travelOptions);

  let itineraryId = null;
  if (LEGACY_SCHEMA_ENABLED && queryId) {
    const itineraryRow = await db.query(
      'INSERT INTO itineraries (query_id, itinerary_text, travel_options) VALUES ($1, $2, $3) RETURNING id',
      [queryId, itineraryText, JSON.stringify(travelOptions)]
    );
    itineraryId = itineraryRow.rows[0].id;
  }

  return {
    queryId,
    itineraryId,
    transcript,
    intent,
    mode: resolvedMode,
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
// POST /auth/forgot-password/send-otp â€” Send OTP to the user's registered phone
app.post('/auth/forgot-password/send-otp', otpLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim();
    if (!email) {
      return res.status(400).json({
        error: 'OTP அனுப்ப மின்னஞ்சல் தேவை',
      });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'இந்த மின்னஞ்சலுக்கு கணக்கு கிடைக்கவில்லை',
      });
    }

    if (!user.phone) {
      return res.status(400).json({
        error: 'இந்த கணக்கில் தொலைபேசி எண் இல்லை. பதிவு செய்யப்பட்ட எண்ணை சேர்த்த பிறகு மீண்டும் முயற்சிக்கவும்.',
      });
    }

    const otpResult = await sendPasswordResetOtp(user.phone);

    res.json({
      success: true,
      message: `OTP ${otpResult.maskedPhone} எண்ணுக்கு அனுப்பப்பட்டது`,
      maskedPhone: otpResult.maskedPhone,
    });
  } catch (err) {
    console.error('POST /auth/forgot-password/send-otp error:', err.message);
    res.status(400).json({
      error: err.message || 'OTP அனுப்ப முடியவில்லை',
    });
  }
});

app.post('/auth/forgot-password/reset', otpLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim();
    const code = String(req.body?.code || '').trim();
    const newPassword = String(req.body?.newPassword || '');

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        error: 'மின்னஞ்சல், OTP, புதிய கடவுச்சொல் ஆகியவை தேவை',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'புதிய கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்',
      });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.phone) {
      return res.status(404).json({
        error: 'இந்த மின்னஞ்சலுக்கு OTP சரிபார்ப்பு செய்ய முடியவில்லை',
      });
    }

    const isApproved = await verifyPasswordResetOtp(user.phone, code);
    if (!isApproved) {
      return res.status(400).json({
        error: 'OTP தவறானது அல்லது காலாவதியானது',
      });
    }

    await updateUserPassword(user.id, newPassword);

    res.json({
      success: true,
      message: 'கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது. இப்போது உள்நுழையலாம்.',
    });
  } catch (err) {
    console.error('POST /auth/forgot-password/reset error:', err.message);
    res.status(400).json({
      error: err.message || 'கடவுச்சொல் மாற்ற முடியவில்லை',
    });
  }
});

// GET /auth/me â€” Get current user profile (requires token)
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
    if (!LEGACY_SCHEMA_ENABLED) {
      return res.json([]);
    }

    const { data: queries, error: queryError } = await supabase
      .from('queries')
      .select('id, transcript, intent, entities, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (queryError) throw queryError;

    const queryIds = (queries || []).map(row => row.id);
    let itinerariesByQueryId = new Map();

    if (queryIds.length > 0) {
      const { data: itineraries, error: itineraryError } = await supabase
        .from('itineraries')
        .select('id, query_id, itinerary_text, travel_options, created_at')
        .in('query_id', queryIds)
        .order('created_at', { ascending: false });

      if (itineraryError) throw itineraryError;

      for (const itinerary of itineraries || []) {
        if (!itinerariesByQueryId.has(itinerary.query_id)) {
          itinerariesByQueryId.set(itinerary.query_id, itinerary);
        }
      }
    }

    const results = (queries || []).map(row => {
      const itinerary = itinerariesByQueryId.get(row.id);
      const storedOptions = safeParseJson(itinerary?.travel_options);
      const looksLikeRouteResults = storedOptions &&
        (Array.isArray(storedOptions.bus) || Array.isArray(storedOptions.train) || Array.isArray(storedOptions.hotels));

      return {
        queryId: row.id,
        transcript: row.transcript,
        intent: row.intent,
        entities: safeParseJson(row.entities),
        createdAt: row.created_at,
        itineraryId: itinerary?.id || null,
        itinerary: itinerary?.itinerary_text || '',
        routeResults: looksLikeRouteResults ? storedOptions : null,
        travelOptions: looksLikeRouteResults ? null : storedOptions,
      };
    });

    res.json(results);
  } catch (err) {
    console.error('GET /recent error:', err);
    res.status(500).json({ error: 'Failed to fetch recent queries' });
  }
});

// POST /query — accepts text, runs NLP + itinerary generation
app.post('/query', apiLimiter, async (req, res) => {
  try {
    const { text, mode } = req.body;
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'text field is required and must be a non-empty string' });
    }

    const result = await processQuery(text.trim(), mode);
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
    const result = await processQuery(transcription.text, req.body?.mode);

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

// POST /search — Search for places (supports Tamil and English)
// POST /payment/create-order â€” Create Razorpay order for a booking
app.post('/payment/create-order', apiLimiter, async (req, res) => {
  try {
    const bookingId = String(req.body?.bookingId || '').trim();
    const customerName = String(req.body?.customerName || 'பயனர்').trim() || 'பயனர்';
    const customerEmail = String(req.body?.customerEmail || '').trim();
    const customerPhone = String(req.body?.customerPhone || '').trim();

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'பதிவு எண் தேவை',
      });
    }

    const booking = await getBooking(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'பதிவு கிடைக்கவில்லை',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'ரத்து செய்யப்பட்ட பதிவுக்கு கட்டணம் செலுத்த முடியாது',
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'இந்த பதிவுக்கு கட்டணம் ஏற்கனவே செலுத்தப்பட்டுள்ளது',
      });
    }

    const order = await createPaymentOrder({
      bookingId,
      totalPrice: booking.totalPrice,
      customerName,
      customerEmail,
      customerPhone: customerPhone || booking.contactPhone,
    });

    const updatedBooking = await updateBookingPayment(bookingId, {
      paymentId: order.orderId,
      paymentStatus: 'pending',
    });

    res.json({
      success: true,
      order,
      booking: updatedBooking,
      message: 'பணம் செலுத்தும் ஆர்டர் உருவாக்கப்பட்டது',
    });
  } catch (err) {
    console.error('POST /payment/create-order error:', err.message);
    res.status(400).json({
      success: false,
      error: err.message || 'பணம் செலுத்தும் ஆர்டர் உருவாக்க முடியவில்லை',
    });
  }
});

// POST /payment/verify â€” Verify Razorpay payment and update booking status
app.post('/payment/verify', apiLimiter, async (req, res) => {
  try {
    const bookingId = String(req.body?.bookingId || '').trim();
    const razorpayOrderId = String(req.body?.razorpay_order_id || '').trim();
    const razorpayPaymentId = String(req.body?.razorpay_payment_id || '').trim();
    const razorpaySignature = String(req.body?.razorpay_signature || '').trim();

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: 'பணம் செலுத்தும் சரிபார்ப்பு விவரங்கள் முழுமையில்லை',
      });
    }

    const booking = await getBooking(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'பதிவு கிடைக்கவில்லை',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'ரத்து செய்யப்பட்ட பதிவுக்கு கட்டணம் சரிபார்க்க முடியாது',
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'இந்த பதிவுக்கு கட்டணம் ஏற்கனவே செலுத்தப்பட்டுள்ளது',
      });
    }

    if (booking.paymentId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        error: 'பணம் செலுத்தும் ஆர்டர் இந்த பதிவுடன் பொருந்தவில்லை',
      });
    }

    const isValid = verifyPaymentSignature({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    });

    if (!isValid) {
      await updateBookingPayment(bookingId, { paymentStatus: 'failed' });
      return res.status(400).json({
        success: false,
        error: 'பணம் செலுத்தும் சரிபார்ப்பு தோல்வியடைந்தது',
      });
    }

    const payment = await getPaymentDetails(razorpayPaymentId);

    if (payment.orderId !== razorpayOrderId) {
      await updateBookingPayment(bookingId, { paymentStatus: 'failed' });
      return res.status(400).json({
        success: false,
        error: 'Razorpay payment order பொருந்தவில்லை',
      });
    }

    if (payment.currency !== 'INR' || Number(payment.amount) !== Number(booking.totalPrice)) {
      await updateBookingPayment(bookingId, { paymentStatus: 'failed' });
      return res.status(400).json({
        success: false,
        error: 'பணம் செலுத்திய தொகை பதிவுடன் பொருந்தவில்லை',
      });
    }

    if (payment.status !== 'captured') {
      await updateBookingPayment(bookingId, { paymentStatus: 'failed' });
      return res.status(400).json({
        success: false,
        error: 'பணம் இன்னும் வெற்றிகரமாக பிடிக்கப்படவில்லை',
      });
    }

    const updatedBooking = await updateBookingPayment(bookingId, {
      status: 'paid',
      paymentId: razorpayPaymentId,
      paymentStatus: 'paid',
    });

    res.json({
      success: true,
      payment,
      booking: updatedBooking,
      message: 'பணம் செலுத்துதல் வெற்றிகரமாக முடிந்தது! 🎉',
    });
  } catch (err) {
    console.error('POST /payment/verify error:', err.message);
    res.status(400).json({
      success: false,
      error: err.message || 'பணம் செலுத்தும் சரிபார்ப்பில் சிக்கல் ஏற்பட்டது',
    });
  }
});

// POST /payment/refund â€” Initiate refund for a cancelled paid booking
app.post('/payment/refund', apiLimiter, async (req, res) => {
  try {
    const bookingId = String(req.body?.bookingId || '').trim();
    const paymentId = String(req.body?.paymentId || '').trim();
    const parsedAmount = Number(req.body?.amount);

    let booking = null;
    if (bookingId) {
      booking = await getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'பதிவு கிடைக்கவில்லை',
        });
      }
    }

    const resolvedPaymentId = paymentId || booking?.paymentId;
    if (!resolvedPaymentId) {
      return res.status(400).json({
        success: false,
        error: 'திருப்பி செலுத்த payment ID தேவை',
      });
    }

    if (booking) {
      if (booking.status !== 'cancelled') {
        return res.status(400).json({
          success: false,
          error: 'முதலில் பதிவை ரத்து செய்த பிறகே refund தொடங்கலாம்',
        });
      }

      if (booking.paymentStatus !== 'paid') {
        return res.status(400).json({
          success: false,
          error: 'செலுத்தப்பட்ட பதிவுகளுக்கே refund செய்ய முடியும்',
        });
      }

      if (booking.refundId) {
        return res.status(400).json({
          success: false,
          error: 'இந்த பதிவுக்கு refund ஏற்கனவே தொடங்கப்பட்டுள்ளது',
        });
      }
    }

    const refundAmount = Number.isFinite(parsedAmount) && parsedAmount > 0
      ? parsedAmount
      : booking?.refundAmount || null;

    if (booking && (!refundAmount || refundAmount <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'இந்த பதிவுக்கு திருப்பி செலுத்த தொகை இல்லை',
      });
    }

    const refund = await initiateRefund(resolvedPaymentId, refundAmount);
    const updatedBooking = bookingId
      ? await updateBookingPayment(bookingId, {
          status: 'cancelled',
          paymentStatus: 'refunded',
          refundId: refund.refundId,
          refundAmount: refund.amount,
        })
      : null;

    res.json({
      success: true,
      refund,
      booking: updatedBooking,
      message: 'பணம் திருப்பி அனுப்பும் செயல்முறை தொடங்கப்பட்டது',
    });
  } catch (err) {
    console.error('POST /payment/refund error:', err.message);
    res.status(400).json({
      success: false,
      error: err.message || 'refund தொடங்க முடியவில்லை',
    });
  }
});

app.post('/search', apiLimiter, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'தேடல் வார்த்தை தேவை' });
    }

    // Translate Tamil to English for database search
    const { translateToEnglish } = require('./services/translationService');
    const englishQuery = translateToEnglish(query.trim());

    // Here you can search your database or return matching places
    // For now, returning the translation result
    res.json({
      originalQuery: query,
      translatedQuery: englishQuery,
      message: `தேடல்: "${query}" → "${englishQuery}"`,
    });
  } catch (err) {
    console.error('POST /search error:', err);
    res.status(500).json({ error: 'தேடல் தோல்வியடைந்தது' });
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
