/**
 * Handles booking creation, retrieval, payment state updates, and cancellation rules.
 */

const { getDb } = require('../db');

const BOOKING_TABLES = ['bus_bookings', 'train_bookings', 'flight_bookings', 'hotel_bookings'];

function generatePnr() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pnr = 'PNR';
  for (let i = 0; i < 9; i += 1) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
}

function getTableName(travelType) {
  const normalized = String(travelType || 'unknown')
    .replace(/[^\w\s]/g, '')
    .trim()
    .toLowerCase();

  if (normalized.includes('bus')) return 'bus_bookings';
  if (normalized.includes('train')) return 'train_bookings';
  if (normalized.includes('flight')) return 'flight_bookings';
  if (normalized.includes('hotel')) return 'hotel_bookings';
  return 'bus_bookings';
}

async function getNextBookingId() {
  const db = await getDb();
  let maxNum = 1000;

  for (const table of BOOKING_TABLES) {
    const res = await db.query(`SELECT booking_id FROM ${table} ORDER BY id DESC LIMIT 1`);
    if (res.rows.length > 0) {
      const num = parseInt(String(res.rows[0].booking_id || '').replace('TN', ''), 10);
      if (!Number.isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  return `TN${maxNum + 1}`;
}

function validatePhone(phone) {
  return /^\d{10}$/.test(String(phone || ''));
}

function mapBookingRow(row, travelType) {
  return {
    bookingId: row.booking_id,
    pnr: row.pnr,
    travelType,
    routeId: row.route_id || null,
    routeMode: row.route_mode || travelType,
    travelName: row.travel_name,
    serviceType: row.service_type || '',
    referenceNumber: row.reference_number || '',
    source: row.source,
    destination: row.destination,
    travelDate: row.travel_date,
    passengers: row.passengers,
    pricePerPerson: row.price_per_person,
    totalPrice: row.total_price,
    contactPhone: row.contact_phone,
    status: row.status,
    paymentId: row.payment_id || '',
    paymentStatus: row.payment_status || 'pending',
    refundId: row.refund_id || '',
    refundAmount: row.refund_amount || 0,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
  };
}

async function findBookingRecord(bookingId, existingDb = null) {
  const db = existingDb || (await getDb());

  for (const table of BOOKING_TABLES) {
    const res = await db.query(`SELECT * FROM ${table} WHERE booking_id = $1`, [bookingId]);
    if (res.rows.length > 0) {
      return {
        row: res.rows[0],
        tableName: table,
        travelType: table.replace('_bookings', ''),
      };
    }
  }

  return null;
}

async function createBooking({ travelOption, passengers, contactPhone, source, destination, travelDate }) {
  if (!travelOption || !travelOption.name || !travelOption.price) {
    throw new Error('சரியான பயண விருப்பத்தை தேர்வு செய்யவும்');
  }
  if (!passengers || passengers < 1 || passengers > 6) {
    throw new Error('பயணிகள் எண்ணிக்கை 1 முதல் 6 வரை இருக்க வேண்டும்');
  }
  if (!validatePhone(contactPhone)) {
    throw new Error('சரியான தொலைபேசி எண்ணை உள்ளிடவும் (10 இலக்கங்கள்)');
  }

  const db = await getDb();
  const bookingId = await getNextBookingId();
  const pnr = generatePnr();
  const pricePerPerson = travelOption.price;
  const totalPrice = pricePerPerson * passengers;
  const travelType = String(travelOption.type || 'unknown').replace(/[^\w\s]/g, '').trim().toLowerCase();
  const routeId = Number.isFinite(Number(travelOption.routeId)) ? Number(travelOption.routeId) : null;
  const routeMode = travelType;
  const travelName = travelOption.name;
  const serviceType = travelOption.serviceType || '';
  const referenceNumber = travelOption.referenceNumber || '';
  const tableName = getTableName(travelType);

  await db.query(
    `
      INSERT INTO ${tableName}
        (booking_id, user_id, route_id, route_mode, travel_name, service_type, reference_number,
         source, destination, travel_date, passengers, price_per_person, total_price,
         contact_phone, pnr, status, payment_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'confirmed', 'pending')
    `,
    [
      bookingId,
      'guest',
      routeId,
      routeMode,
      travelName,
      serviceType,
      referenceNumber,
      source || 'Unknown',
      destination || 'Unknown',
      travelDate || '',
      passengers,
      pricePerPerson,
      totalPrice,
      contactPhone,
      pnr,
    ]
  );

  console.log(`[bookingService] Created booking ${bookingId} in ${tableName} (PNR: ${pnr})`);

  return {
    bookingId,
    pnr,
    travelType,
    routeId,
    routeMode,
    travelName,
    serviceType,
    referenceNumber,
    source: source || 'Unknown',
    destination: destination || 'Unknown',
    travelDate: travelDate || '',
    passengers,
    pricePerPerson,
    totalPrice,
    contactPhone,
    status: 'confirmed',
    paymentId: '',
    paymentStatus: 'pending',
    refundId: '',
    refundAmount: 0,
    createdAt: new Date().toISOString(),
  };
}

async function getBooking(bookingId) {
  const found = await findBookingRecord(bookingId);
  if (!found) return null;
  return mapBookingRow(found.row, found.travelType);
}

async function updateBookingPayment(bookingId, { status, paymentId, paymentStatus, refundId, refundAmount }) {
  const db = await getDb();
  const found = await findBookingRecord(bookingId, db);

  if (!found) {
    throw new Error('பதிவு கிடைக்கவில்லை');
  }

  const updates = [];
  const values = [];

  if (status) {
    values.push(status);
    updates.push(`status = $${values.length}`);
  }
  if (typeof paymentId !== 'undefined') {
    values.push(paymentId || null);
    updates.push(`payment_id = $${values.length}`);
  }
  if (typeof paymentStatus !== 'undefined') {
    values.push(paymentStatus);
    updates.push(`payment_status = $${values.length}`);
  }
  if (typeof refundId !== 'undefined') {
    values.push(refundId || null);
    updates.push(`refund_id = $${values.length}`);
  }
  if (typeof refundAmount !== 'undefined') {
    values.push(refundAmount);
    updates.push(`refund_amount = $${values.length}`);
  }

  if (updates.length === 0) {
    return mapBookingRow(found.row, found.travelType);
  }

  values.push(bookingId);
  await db.query(
    `UPDATE ${found.tableName} SET ${updates.join(', ')} WHERE booking_id = $${values.length}`,
    values
  );

  const refreshed = await findBookingRecord(bookingId, db);
  return mapBookingRow(refreshed.row, refreshed.travelType);
}

async function cancelBooking(bookingId) {
  const db = await getDb();
  const found = await findBookingRecord(bookingId, db);

  if (!found) {
    return { success: false, message: 'பதிவு கிடைக்கவில்லை' };
  }

  const { row, tableName, travelType } = found;
  if (row.status === 'cancelled') {
    return { success: false, message: 'இந்த பதிவு ஏற்கனவே ரத்து செய்யப்பட்டது' };
  }

  if (row.travel_date) {
    const travelDate = new Date(row.travel_date);
    if (!Number.isNaN(travelDate.getTime()) && travelDate < new Date()) {
      return { success: false, message: 'பயண தேதி கடந்துவிட்டதால் ரத்து செய்ய இயலாது' };
    }
  }

  const bookingTime = new Date(row.created_at);
  const now = new Date();
  const hoursSinceBooking = (now - bookingTime) / (1000 * 60 * 60);
  const isPaid = row.payment_status === 'paid';

  let refundPercent = 0;
  let refundAmount = 0;
  let message = 'பதிவு ரத்து செய்யப்பட்டது';

  if (isPaid) {
    if (hoursSinceBooking <= 1) {
      refundPercent = 100;
      refundAmount = row.total_price;
      message = `ரத்து செய்யப்பட்டது. முழு பணம் திருப்பி அளிக்கப்படும் (₹${refundAmount})`;
    } else if (hoursSinceBooking <= 24) {
      refundPercent = 50;
      refundAmount = Math.floor(row.total_price * 0.5);
      message = `ரத்து செய்யப்பட்டது. 50% பணம் திருப்பி அளிக்கப்படும் (₹${refundAmount})`;
    } else {
      message = 'ரத்து செய்யப்பட்டது. 24 மணி நேரத்திற்கு மேல் ஆனதால் பணம் திருப்பி அளிக்கப்படாது';
    }
  } else {
    message = 'பதிவு ரத்து செய்யப்பட்டது. பணம் இன்னும் செலுத்தப்படாததால் திருப்பி தொகை இல்லை';
  }

  await db.query(
    `
      UPDATE ${tableName}
      SET status = 'cancelled', refund_amount = $1, cancelled_at = CURRENT_TIMESTAMP
      WHERE booking_id = $2
    `,
    [refundAmount, bookingId]
  );

  const updated = await findBookingRecord(bookingId, db);

  return {
    success: true,
    message,
    refundAmount,
    refundPercent,
    bookingId,
    booking: mapBookingRow(updated.row, travelType),
  };
}

async function getAllBookings() {
  const db = await getDb();
  const query = `
    SELECT *, 'bus' AS travel_type FROM bus_bookings
    UNION ALL
    SELECT *, 'train' AS travel_type FROM train_bookings
    UNION ALL
    SELECT *, 'flight' AS travel_type FROM flight_bookings
    UNION ALL
    SELECT *, 'hotel' AS travel_type FROM hotel_bookings
    ORDER BY created_at DESC
  `;

  const res = await db.query(query);
  return res.rows.map((row) => mapBookingRow(row, row.travel_type));
}

module.exports = {
  BOOKING_TABLES,
  createBooking,
  getBooking,
  updateBookingPayment,
  cancelBooking,
  getAllBookings,
};
