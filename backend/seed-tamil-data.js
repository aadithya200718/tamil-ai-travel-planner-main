/**
 * seed-tamil-data.js
 * Import Tamil bus and train data into PostgreSQL database
 * 
 * Usage:
 *   node backend/seed-tamil-data.js --delete    # Delete old data first
 *   node backend/seed-tamil-data.js             # Just add new data
 */

const { Pool } = require('pg');
require('./loadEnv');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/travelplanner',
});

// Tamil Bus Data
const busData = [
  { source: 'சென்னை', destination: 'கோயம்புத்தூர்', distance_km: 286, bus_type: 'ஸ்லீப்பர்', price_inr: 629 },
  { source: 'சென்னை', destination: 'மதுரை', distance_km: 669, bus_type: 'எக்ஸ்பிரஸ்', price_inr: 802 },
  { source: 'சென்னை', destination: 'திருச்சி', distance_km: 536, bus_type: 'ஸ்லீப்பர்', price_inr: 1179 },
  { source: 'சென்னை', destination: 'சேலம்', distance_km: 532, bus_type: 'ஸ்லீப்பர்', price_inr: 1170 },
  { source: 'சென்னை', destination: 'ஈரோடு', distance_km: 376, bus_type: 'ஸ்லீப்பர்', price_inr: 827 },
  { source: 'சென்னை', destination: 'திருநெல்வேலி', distance_km: 483, bus_type: 'சாதாரண', price_inr: 386 },
  { source: 'சென்னை', destination: 'வேலூர்', distance_km: 117, bus_type: 'எக்ஸ்பிரஸ்', price_inr: 140 },
  { source: 'சென்னை', destination: 'தூத்துக்குடி', distance_km: 276, bus_type: 'ஸ்லீப்பர்', price_inr: 607 },
  { source: 'சென்னை', destination: 'திண்டுக்கல்', distance_km: 147, bus_type: 'ஏசி', price_inr: 264 },
  { source: 'கோயம்புத்தூர்', destination: 'சென்னை', distance_km: 458, bus_type: 'ஸ்லீப்பர்', price_inr: 1007 },
  { source: 'கோயம்புத்தூர்', destination: 'மதுரை', distance_km: 499, bus_type: 'எக்ஸ்பிரஸ்', price_inr: 598 },
  { source: 'கோயம்புத்தூர்', destination: 'திருச்சி', distance_km: 557, bus_type: 'சாதாரண', price_inr: 445 },
  { source: 'கோயம்புத்தூர்', destination: 'சேலம்', distance_km: 405, bus_type: 'சாதாரண', price_inr: 324 },
  { source: 'கோயம்புத்தூர்', destination: 'ஈரோடு', distance_km: 275, bus_type: 'ஏசி', price_inr: 495 },
  { source: 'கோயம்புத்தூர்', destination: 'திருநெல்வேலி', distance_km: 418, bus_type: 'ஏசி', price_inr: 752 },
  { source: 'கோயம்புத்தூர்', destination: 'வேலூர்', distance_km: 260, bus_type: 'ஏசி', price_inr: 468 },
  { source: 'கோயம்புத்தூர்', destination: 'தூத்துக்குடி', distance_km: 546, bus_type: 'எக்ஸ்பிரஸ்', price_inr: 655 },
  { source: 'கோயம்புத்தூர்', destination: 'திண்டுக்கல்', distance_km: 412, bus_type: 'எக்ஸ்பிரஸ்', price_inr: 494 },
  { source: 'மதுரை', destination: 'சென்னை', distance_km: 119, bus_type: 'ஸ்லீப்பர்', price_inr: 261 },
  { source: 'மதுரை', destination: 'கோயம்புத்தூர்', distance_km: 514, bus_type: 'ஸ்லீப்பர்', price_inr: 1130 },
  // Add more bus data as needed...
];

// Tamil Train Data
const trainData = [
  { source: 'சென்னை', destination: 'கோயம்புத்தூர்', distance_km: 286, train_type: 'சூப்பர்ஃபாஸ்ட்', train_number: '12000', price_inr: 307 },
  { source: 'சென்னை', destination: 'மதுரை', distance_km: 669, train_type: 'பேஸஞ்சர்', train_number: '12001', price_inr: 267 },
  { source: 'சென்னை', destination: 'திருச்சி', distance_km: 536, train_type: 'சூப்பர்ஃபாஸ்ட்', train_number: '12002', price_inr: 532 },
  { source: 'சென்னை', destination: 'சேலம்', distance_km: 532, train_type: 'எக்ஸ்பிரஸ்', train_number: '12003', price_inr: 339 },
  { source: 'சென்னை', destination: 'ஈரோடு', distance_km: 376, train_type: 'சூப்பர்ஃபாஸ்ட்', train_number: '12004', price_inr: 388 },
  { source: 'சென்னை', destination: 'திருநெல்வேலி', distance_km: 483, train_type: 'எக்ஸ்பிரஸ்', train_number: '12005', price_inr: 309 },
  { source: 'சென்னை', destination: 'வேலூர்', distance_km: 117, train_type: 'பேஸஞ்சர்', train_number: '12006', price_inr: 46 },
  { source: 'சென்னை', destination: 'தூத்துக்குடி', distance_km: 276, train_type: 'எக்ஸ்பிரஸ்', train_number: '12007', price_inr: 185 },
  { source: 'சென்னை', destination: 'திண்டுக்கல்', distance_km: 147, train_type: 'எக்ஸ்பிரஸ்', train_number: '12008', price_inr: 108 },
  { source: 'கோயம்புத்தூர்', destination: 'சென்னை', distance_km: 458, train_type: 'சூப்பர்ஃபாஸ்ட்', train_number: '12009', price_inr: 462 },
  { source: 'கோயம்புத்தூர்', destination: 'மதுரை', distance_km: 499, train_type: 'சூப்பர்ஃபாஸ்ட்', train_number: '12010', price_inr: 499 },
  // Add more train data as needed...
];

async function createTables() {
  console.log('\n📊 Creating Tamil travel data tables...\n');
  
  try {
    // Create bus_routes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bus_routes (
        id SERIAL PRIMARY KEY,
        source TEXT NOT NULL,
        destination TEXT NOT NULL,
        distance_km INTEGER NOT NULL,
        bus_type TEXT NOT NULL,
        price_inr INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ bus_routes table created');

    // Create train_routes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS train_routes (
        id SERIAL PRIMARY KEY,
        source TEXT NOT NULL,
        destination TEXT NOT NULL,
        distance_km INTEGER NOT NULL,
        train_type TEXT NOT NULL,
        train_number TEXT NOT NULL,
        price_inr INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ train_routes table created');

  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
    throw err;
  }
}

async function deleteOldData() {
  console.log('\n🗑️  Deleting old travel data...\n');
  
  try {
    await pool.query('TRUNCATE TABLE bus_routes RESTART IDENTITY CASCADE');
    console.log('✅ Deleted all bus routes');

    await pool.query('TRUNCATE TABLE train_routes RESTART IDENTITY CASCADE');
    console.log('✅ Deleted all train routes');

  } catch (err) {
    console.error('❌ Error deleting data:', err.message);
    throw err;
  }
}

async function insertBusData() {
  console.log('\n🚌 Inserting Tamil bus data...\n');
  
  let count = 0;
  for (const bus of busData) {
    try {
      await pool.query(
        'INSERT INTO bus_routes (source, destination, distance_km, bus_type, price_inr) VALUES ($1, $2, $3, $4, $5)',
        [bus.source, bus.destination, bus.distance_km, bus.bus_type, bus.price_inr]
      );
      count++;
    } catch (err) {
      console.error(`❌ Error inserting bus route ${bus.source} → ${bus.destination}:`, err.message);
    }
  }
  
  console.log(`✅ Inserted ${count} bus routes`);
}

async function insertTrainData() {
  console.log('\n🚂 Inserting Tamil train data...\n');
  
  let count = 0;
  for (const train of trainData) {
    try {
      await pool.query(
        'INSERT INTO train_routes (source, destination, distance_km, train_type, train_number, price_inr) VALUES ($1, $2, $3, $4, $5, $6)',
        [train.source, train.destination, train.distance_km, train.train_type, train.train_number, train.price_inr]
      );
      count++;
    } catch (err) {
      console.error(`❌ Error inserting train route ${train.source} → ${train.destination}:`, err.message);
    }
  }
  
  console.log(`✅ Inserted ${count} train routes`);
}

async function showSummary() {
  console.log('\n📈 Data Summary:\n');
  
  try {
    const busCount = await pool.query('SELECT COUNT(*) as count FROM bus_routes');
    console.log(`   பேருந்து வழிகள்: ${busCount.rows[0].count} routes`);

    const trainCount = await pool.query('SELECT COUNT(*) as count FROM train_routes');
    console.log(`   ரயில் வழிகள்: ${trainCount.rows[0].count} routes`);

    // Show sample data
    console.log('\n🔍 Sample Bus Routes:\n');
    const sampleBus = await pool.query('SELECT * FROM bus_routes LIMIT 3');
    sampleBus.rows.forEach(row => {
      console.log(`   ${row.source} → ${row.destination} | ${row.bus_type} | ₹${row.price_inr}`);
    });

    console.log('\n🔍 Sample Train Routes:\n');
    const sampleTrain = await pool.query('SELECT * FROM train_routes LIMIT 3');
    sampleTrain.rows.forEach(row => {
      console.log(`   ${row.source} → ${row.destination} | ${row.train_type} | Train ${row.train_number} | ₹${row.price_inr}`);
    });

  } catch (err) {
    console.error('❌ Error fetching summary:', err.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes('--delete');

  try {
    console.log('🚀 Starting Tamil travel data import...\n');

    // Step 1: Create tables
    await createTables();

    // Step 2: Delete old data if requested
    if (shouldDelete) {
      await deleteOldData();
    }

    // Step 3: Insert new data
    await insertBusData();
    await insertTrainData();

    // Step 4: Show summary
    await showSummary();

    console.log('\n✅ Tamil travel data import completed successfully!\n');

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
