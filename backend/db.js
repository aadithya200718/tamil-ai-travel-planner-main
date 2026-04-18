const { Pool } = require('pg');
require('./loadEnv');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/travelplanner',
});

async function getDb() {
  return pool;
}

async function initializeSchema() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        preferred_language TEXT DEFAULT 'ta',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const bookingSchemaPart = `
      id SERIAL PRIMARY KEY,
      booking_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      route_id INTEGER,
      route_mode TEXT,
      travel_name TEXT NOT NULL,
      service_type TEXT,
      reference_number TEXT,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      travel_date TEXT,
      passengers INTEGER NOT NULL,
      price_per_person INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      contact_phone TEXT NOT NULL,
      pnr TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      payment_id TEXT,
      payment_status TEXT DEFAULT 'pending',
      refund_id TEXT,
      refund_amount INTEGER DEFAULT 0,
      cancelled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `;

    const bookingTables = ['bus_bookings', 'train_bookings', 'flight_bookings', 'hotel_bookings'];

    for (const table of bookingTables) {
      await client.query(`CREATE TABLE IF NOT EXISTS ${table} (${bookingSchemaPart});`);
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS route_id INTEGER;`);
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS route_mode TEXT;`);
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS service_type TEXT;`);
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS reference_number TEXT;`);
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS payment_id TEXT;`);
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';`);
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS refund_id TEXT;`);
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0;`);
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;`);
    }

    if (process.env.ENABLE_LEGACY_SCHEMA === 'false') {
      await client.query('COMMIT');
      return;
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS queries (
        id SERIAL PRIMARY KEY,
        transcript TEXT NOT NULL,
        intent TEXT,
        entities TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS itineraries (
        id SERIAL PRIMARY KEY,
        query_id INTEGER NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
        itinerary_text TEXT NOT NULL,
        travel_options TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Schema Initialization Error', e);
  } finally {
    client.release();
  }
}

initializeSchema().catch(console.error);

module.exports = { getDb, pool };
