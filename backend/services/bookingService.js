/**
 * Handles booking creation, retrieval, payment state updates, and cancellation rules.
 */

const BOOKING_TABLES = ['bus_bookings', 'train_bookings', 'flight_bookings', 'hotel_bookings'];

function getSupabase() {
  return require('../db').supabase;
}

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
  const supabase = getSupabase();
  let maxNum = 1000;

  for (const table of BOOKING_TABLES) {
    const { data } = await supabase
      .from(table)
      .select('booking_id')
      .order('id', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const num = parseInt(String(data[0].booking_id || '').replace('TN', ''), 10);
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

function parseDateOnly(value) {
  const text = String(value || '').trim();
  if (!text) return null;

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

async function findBookingRecord(bookingId) {
  const supabase = getSupabase();

  for (const table of BOOKING_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('booking_id', bookingId)
      .limit(1);

    if (!error && data && data.length > 0) {
      return {
        row: data[0],
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

  const supabase = getSupabase();
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

  const { error } = await supabase
    .from(tableName)
    .insert({
      booking_id: bookingId,
      user_id: 'guest',
      route_id: routeId,
      route_mode: routeMode,
      travel_name: travelName,
      service_type: serviceType,
      reference_number: referenceNumber,
      source: source || 'Unknown',
      destination: destination || 'Unknown',
      travel_date: travelDate || '',
      passengers,
      price_per_person: pricePerPerson,
      total_price: totalPrice,
      contact_phone: contactPhone,
      pnr,
      status: 'confirmed',
      payment_status: 'pending',
    });

  if (error) throw new Error(`Booking creation failed: ${error.message}`);

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
  const supabase = getSupabase();
  const found = await findBookingRecord(bookingId);

  if (!found) {
    throw new Error('பதிவு கிடைக்கவில்லை');
  }

  const updates = {};
  if (status) updates.status = status;
  if (typeof paymentId !== 'undefined') updates.payment_id = paymentId || null;
  if (typeof paymentStatus !== 'undefined') updates.payment_status = paymentStatus;
  if (typeof refundId !== 'undefined') updates.refund_id = refundId || null;
  if (typeof refundAmount !== 'undefined') updates.refund_amount = refundAmount;

  if (Object.keys(updates).length === 0) {
    return mapBookingRow(found.row, found.travelType);
  }

  const { error } = await supabase
    .from(found.tableName)
    .update(updates)
    .eq('booking_id', bookingId);

  if (error) throw new Error(`Booking update failed: ${error.message}`);

  const refreshed = await findBookingRecord(bookingId);
  return mapBookingRow(refreshed.row, refreshed.travelType);
}

async function cancelBooking(bookingId) {
  const supabase = getSupabase();
  const found = await findBookingRecord(bookingId);

  if (!found) {
    return { success: false, message: 'பதிவு கிடைக்கவில்லை' };
  }

  const { row, tableName, travelType } = found;
  if (row.status === 'cancelled') {
    return { success: false, message: 'இந்த பதிவு ஏற்கனவே ரத்து செய்யப்பட்டது' };
  }

  if (row.travel_date) {
    const travelDate = parseDateOnly(row.travel_date) || new Date(row.travel_date);
    if (!Number.isNaN(travelDate.getTime()) && travelDate < startOfToday()) {
      return { success: false, message: 'பயண தேதி கடந்துவிட்டதால் ரத்து செய்ய இயலாது' };
    }
  }

  const bookingTime = new Date(row.created_at);
  const now = new Date();
  const hoursSinceBooking = (now - bookingTime) / (1000 * 60 * 60);
  const isPaid = row.payment_status === 'paid';

  let refundAmount = 0;
  let refundPercent = 0;
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

  const { error } = await supabase
    .from(tableName)
    .update({
      status: 'cancelled',
      refund_amount: refundAmount,
      cancelled_at: new Date().toISOString(),
    })
    .eq('booking_id', bookingId);

  if (error) throw new Error(`Cancel failed: ${error.message}`);

  const updated = await findBookingRecord(bookingId);

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
  const supabase = getSupabase();
  const allBookings = [];

  for (const table of BOOKING_TABLES) {
    const travelType = table.replace('_bookings', '');
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      for (const row of data) {
        allBookings.push(mapBookingRow(row, travelType));
      }
    }
  }

  allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return allBookings;
}

module.exports = {
  BOOKING_TABLES,
  createBooking,
  getBooking,
  updateBookingPayment,
  cancelBooking,
  getAllBookings,
};
