const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// ─── Auth API functions ─────────────────────────────────────────────────────

/**
 * Register a new user.
 */
export async function registerUser({ name, email, phone, password }) {
  const res = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'பதிவு தோல்வியடைந்தது');
  }
  return data;
}

/**
 * Login an existing user.
 */
export async function loginUser({ email, password }) {
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'உள்நுழைவு தோல்வியடைந்தது');
  }
  return data;
}

export async function sendForgotPasswordOtp({ email }) {
  const res = await fetch(`${BACKEND_URL}/auth/forgot-password/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'OTP அனுப்ப முடியவில்லை');
  }
  return data;
}

export async function resetPasswordWithOtp({ email, code, newPassword }) {
  const res = await fetch(`${BACKEND_URL}/auth/forgot-password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'கடவுச்சொல் மாற்ற முடியவில்லை');
  }
  return data;
}

/**
 * Get current user profile.
 */
export async function getProfile(token) {
  const res = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'சுயவிவரம் பெற இயலவில்லை');
  }
  return data;
}

/**
 * Send a text query to the backend.
 * @param {string} text
 * @returns {Promise<object>}
 */
export async function sendQuery(text, mode = '', language = 'ta') {
  const res = await fetch(`${BACKEND_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mode, language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to process query');
  }
  return res.json();
}

/**
 * Send an audio blob to the backend for voice processing.
 * @param {Blob} audioBlob
 * @returns {Promise<object>}
 */
export async function sendVoice(audioBlob, mode = '', language = 'ta') {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('mode', mode);
  formData.append('language', language);

  const res = await fetch(`${BACKEND_URL}/voice`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'குரல் அங்கீகாரம் தோல்வியடைந்தது');
  }
  return res.json();
}

/**
 * Fetch the 10 most recent queries.
 * @returns {Promise<Array>}
 */
export async function fetchRecent() {
  const res = await fetch(`${BACKEND_URL}/recent`);
  if (!res.ok) throw new Error('Failed to fetch recent queries');
  return res.json();
}

/**
 * Check backend health.
 * @returns {Promise<object>}
 */
export async function checkHealth() {
  const res = await fetch(`${BACKEND_URL}/health`);
  if (!res.ok) throw new Error('Backend unavailable');
  return res.json();
}

// ─── Booking API functions ──────────────────────────────────────────────────

/**
 * Create a new booking.
 * @param {object} bookingData - { travelOption, passengers, contactPhone, source, destination }
 * @returns {Promise<object>}
 */
export async function createBooking(bookingData) {
  const res = await fetch(`${BACKEND_URL}/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'பதிவு தோல்வியடைந்தது');
  }
  return res.json();
}

export async function createPaymentOrderForBooking(paymentData) {
  const res = await fetch(`${BACKEND_URL}/payment/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'பணம் செலுத்தும் ஆர்டர் உருவாக்க முடியவில்லை');
  }
  return data;
}

export async function verifyBookingPayment(paymentData) {
  const res = await fetch(`${BACKEND_URL}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'பணம் செலுத்தும் சரிபார்ப்பு தோல்வியடைந்தது');
  }
  return data;
}

export async function refundBookingPayment({ bookingId, paymentId, amount }) {
  const res = await fetch(`${BACKEND_URL}/payment/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, paymentId, amount }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'refund தொடங்க முடியவில்லை');
  }
  return data;
}

/**
 * Get booking details by booking ID.
 * @param {string} bookingId - e.g. "TN1001"
 * @returns {Promise<object>}
 */
export async function getBooking(bookingId) {
  const res = await fetch(`${BACKEND_URL}/booking/${bookingId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'பதிவு கிடைக்கவில்லை');
  }
  return res.json();
}

/**
 * Cancel a booking (conditional refund).
 * @param {string} bookingId
 * @returns {Promise<object>}
 */
export async function cancelBooking(bookingId) {
  const res = await fetch(`${BACKEND_URL}/booking/${bookingId}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'ரத்து செய்ய இயலவில்லை');
  }
  return res.json();
}

/**
 * Get all bookings.
 * @returns {Promise<Array>}
 */
export async function getAllBookings() {
  const res = await fetch(`${BACKEND_URL}/bookings`);
  if (!res.ok) throw new Error('பதிவுகளை பெற இயலவில்லை');
  return res.json();
}
