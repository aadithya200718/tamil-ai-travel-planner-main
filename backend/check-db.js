/**
 * check-db.js
 * Read-only Supabase table check for Tamil AI Travel Planner.
 *
 * Usage:
 *   node backend/check-db.js
 */

require('./loadEnv');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLES = [
  'users',
  'queries',
  'itineraries',
  'bus_bookings',
  'train_bookings',
  'flight_bookings',
  'hotel_bookings',
  'bus_routes',
  'train_routes',
  'hotels',
];

async function countTable(table) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    return { table, ok: false, error: error.message };
  }

  return { table, ok: true, count: count || 0 };
}

async function printRecentQueries() {
  const { data, error } = await supabase
    .from('queries')
    .select('id, transcript, intent, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('\nRecent Queries:\n');

  if (error) {
    console.log(`   Could not fetch recent queries: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('   No queries found.');
    return;
  }

  data.forEach(row => {
    console.log(`   ID: ${row.id}`);
    console.log(`   Transcript: ${row.transcript}`);
    console.log(`   Intent: ${row.intent || '-'}`);
    console.log(`   Created: ${row.created_at}`);
    console.log('   ---');
  });
}

async function main() {
  console.log('\nChecking Supabase Tables...\n');

  const results = await Promise.all(TABLES.map(countTable));

  for (const result of results) {
    if (result.ok) {
      console.log(`   ${result.table.padEnd(20)} : ${result.count} records`);
    } else {
      console.log(`   ${result.table.padEnd(20)} : Error - ${result.error}`);
    }
  }

  await printRecentQueries();
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
