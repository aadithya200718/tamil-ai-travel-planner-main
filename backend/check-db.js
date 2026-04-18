/**
 * check-db.js
 * Script to check PostgreSQL tables and optionally delete data
 * 
 * Usage:
 *   node backend/check-db.js              # Check tables and count records
 *   node backend/check-db.js --delete     # Delete all data (CAREFUL!)
 *   node backend/check-db.js --drop       # Drop all tables (VERY CAREFUL!)
 */

const { Pool } = require('pg');
require('./loadEnv');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/travelplanner',
});

const TABLES = [
  'users',
  'queries',
  'itineraries',
  'bus_bookings',
  'train_bookings',
  'flight_bookings',
  'hotel_bookings',
  'bus_routes',
  'train_routes'
];

async function checkTables() {
  console.log('\n📊 Checking PostgreSQL Tables...\n');
  
  try {
    // Check if tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const existingTables = result.rows.map(row => row.table_name);
    
    console.log('✅ Existing Tables:');
    existingTables.forEach(table => {
      console.log(`   - ${table}`);
    });
    
    console.log('\n📈 Record Counts:\n');
    
    // Count records in each table
    for (const table of TABLES) {
      if (existingTables.includes(table)) {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = countResult.rows[0].count;
          console.log(`   ${table.padEnd(20)} : ${count} records`);
        } catch (err) {
          console.log(`   ${table.padEnd(20)} : Error - ${err.message}`);
        }
      } else {
        console.log(`   ${table.padEnd(20)} : ❌ Table does not exist`);
      }
    }
    
    // Show sample queries data (Tamil)
    console.log('\n🔍 Sample Queries (Last 3):\n');
    try {
      const sampleResult = await pool.query(`
        SELECT id, transcript, intent, created_at 
        FROM queries 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      if (sampleResult.rows.length > 0) {
        sampleResult.rows.forEach(row => {
          console.log(`   ID: ${row.id}`);
          console.log(`   Transcript: ${row.transcript}`);
          console.log(`   Intent: ${row.intent}`);
          console.log(`   Created: ${row.created_at}`);
          console.log('   ---');
        });
      } else {
        console.log('   No queries found.');
      }
    } catch (err) {
      console.log(`   Error fetching queries: ${err.message}`);
    }
    
  } catch (err) {
    console.error('❌ Error checking tables:', err.message);
  }
}

async function deleteAllData() {
  console.log('\n⚠️  DELETING ALL DATA FROM ALL TABLES...\n');
  
  try {
    await pool.query('BEGIN');
    
    // Delete in reverse order to respect foreign keys
    const deleteOrder = [
      'hotel_bookings',
      'flight_bookings',
      'train_bookings',
      'bus_bookings',
      'itineraries',
      'queries',
      'users'
    ];
    
    for (const table of deleteOrder) {
      try {
        const result = await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        console.log(`   ✅ Deleted all data from ${table}`);
      } catch (err) {
        console.log(`   ⚠️  Could not delete from ${table}: ${err.message}`);
      }
    }
    
    await pool.query('COMMIT');
    console.log('\n✅ All data deleted successfully!\n');
    
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('❌ Error deleting data:', err.message);
  }
}

async function dropAllTables() {
  console.log('\n⚠️  DROPPING ALL TABLES (REMOVING TABLE STRUCTURE)...\n');
  
  try {
    await pool.query('BEGIN');
    
    // Drop in reverse order to respect foreign keys
    const dropOrder = [
      'hotel_bookings',
      'flight_bookings',
      'train_bookings',
      'bus_bookings',
      'itineraries',
      'queries',
      'users'
    ];
    
    for (const table of dropOrder) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`   ✅ Dropped table ${table}`);
      } catch (err) {
        console.log(`   ⚠️  Could not drop ${table}: ${err.message}`);
      }
    }
    
    await pool.query('COMMIT');
    console.log('\n✅ All tables dropped successfully!\n');
    console.log('💡 Restart your backend server to recreate tables.\n');
    
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('❌ Error dropping tables:', err.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--delete')) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('⚠️  Are you sure you want to DELETE ALL DATA? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        await deleteAllData();
      } else {
        console.log('❌ Deletion cancelled.');
      }
      readline.close();
      await pool.end();
    });
  } else if (args.includes('--drop')) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('⚠️  Are you sure you want to DROP ALL TABLES? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        await dropAllTables();
      } else {
        console.log('❌ Drop cancelled.');
      }
      readline.close();
      await pool.end();
    });
  } else {
    await checkTables();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
