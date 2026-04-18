/**
 * import-excel-data.js
 * Reset/import Tamil bus and train data from Excel files into PostgreSQL.
 *
 * Usage:
 *   node backend/import-excel-data.js --delete
 *   node backend/import-excel-data.js --reset [--drop-users]
 *   node backend/import-excel-data.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('./loadEnv');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/travelplanner',
});

const ROUTE_TABLES = ['bus_routes', 'train_routes'];
const LEGACY_TABLES = [
  'bus_bookings',
  'train_bookings',
  'flight_bookings',
  'hotel_bookings',
  'itineraries',
  'queries',
];

let xlsxModule = null;

function getXlsx() {
  if (!xlsxModule) {
    xlsxModule = require('xlsx');
  }

  return xlsxModule;
}

function resolveExcelFile(label, filenames) {
  const filePath = filenames
    .map(filename => path.join(__dirname, '..', filename))
    .find(candidate => fs.existsSync(candidate));

  if (!filePath) {
    throw new Error(`${label} file not found. Looked for: ${filenames.join(', ')}`);
  }

  return filePath;
}

function getBusFilePath() {
  return resolveExcelFile('Bus dataset', [
    'bus_dataset_tamil.xlsx',
    'bus-dataset-tamil.xlsx',
  ]);
}

function getTrainFilePath() {
  return resolveExcelFile('Train dataset', [
    'train_dataset_tamil.xlsx',
    'train-dataset-tamil.xlsx',
  ]);
}

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
  );
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '');
}

function toInteger(value, fieldName) {
  const parsed = Number.parseInt(String(value).replace(/[^\d-]/g, ''), 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer for ${fieldName}: ${value}`);
  }

  return parsed;
}

async function createRouteTables(db = pool) {
  console.log('\nCreating Tamil route tables...\n');

  await db.query(`
    CREATE TABLE IF NOT EXISTS bus_routes (
      id SERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      distance_km INTEGER NOT NULL,
      bus_type TEXT NOT NULL,
      price_inr INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(source, destination, bus_type)
    );
  `);
  console.log('Created bus_routes');

  await db.query(`
    CREATE TABLE IF NOT EXISTS train_routes (
      id SERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      distance_km INTEGER NOT NULL,
      train_type TEXT NOT NULL,
      train_number TEXT NOT NULL,
      price_inr INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(source, destination, train_number)
    );
  `);
  console.log('Created train_routes');

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_bus_source ON bus_routes(source);
    CREATE INDEX IF NOT EXISTS idx_bus_destination ON bus_routes(destination);
    CREATE INDEX IF NOT EXISTS idx_train_source ON train_routes(source);
    CREATE INDEX IF NOT EXISTS idx_train_destination ON train_routes(destination);
  `);
  console.log('Created route indexes');
}

async function truncateRouteData() {
  console.log('\nDeleting existing route data...\n');

  const busResult = await pool.query('DELETE FROM bus_routes');
  console.log(`Deleted ${busResult.rowCount} rows from bus_routes`);

  const trainResult = await pool.query('DELETE FROM train_routes');
  console.log(`Deleted ${trainResult.rowCount} rows from train_routes`);

  await pool.query('ALTER SEQUENCE IF EXISTS bus_routes_id_seq RESTART WITH 1');
  await pool.query('ALTER SEQUENCE IF EXISTS train_routes_id_seq RESTART WITH 1');
  console.log('Reset route ID sequences');
}

async function resetSchema({ dropUsers = false }) {
  console.log('\nResetting database schema...\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tablesToDrop = [...ROUTE_TABLES, ...LEGACY_TABLES];
    if (dropUsers) {
      tablesToDrop.push('users');
    }

    for (const table of tablesToDrop) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`Dropped ${table}`);
    }

    await createRouteTables(client);
    await client.query('COMMIT');

    console.log(dropUsers ? 'Dropped user accounts too' : 'Kept user accounts');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function readExcelFile(filePath) {
  const xlsx = getXlsx();
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet);
}

function mapBusRow(row) {
  const normalized = normalizeRow(row);
  const source = firstDefined(normalized.source, normalized.from, normalized.sourcecity);
  const destination = firstDefined(normalized.destination, normalized.to, normalized.destinationcity);
  const distance = toInteger(
    firstDefined(normalized.distancekm, normalized.distance, normalized.km),
    'distance_km'
  );
  const busType = firstDefined(normalized.bustype, normalized.type, normalized.category);
  const price = toInteger(
    firstDefined(normalized.priceinr, normalized.price, normalized.fare, normalized.amount),
    'price_inr'
  );

  if (!source || !destination || !busType) {
    throw new Error('Missing required bus columns');
  }

  return { source, destination, distance, busType, price };
}

function mapTrainRow(row) {
  const normalized = normalizeRow(row);
  const source = firstDefined(normalized.source, normalized.from, normalized.sourcecity);
  const destination = firstDefined(normalized.destination, normalized.to, normalized.destinationcity);
  const distance = toInteger(
    firstDefined(normalized.distancekm, normalized.distance, normalized.km),
    'distance_km'
  );
  const trainType = firstDefined(normalized.traintype, normalized.type, normalized.category);
  const trainNumber = firstDefined(normalized.trainnumber, normalized.trainno, normalized.number);
  const price = toInteger(
    firstDefined(normalized.priceinr, normalized.price, normalized.fare, normalized.amount),
    'price_inr'
  );

  if (!source || !destination || !trainType || !trainNumber) {
    throw new Error('Missing required train columns');
  }

  return { source, destination, distance, trainType, trainNumber: String(trainNumber), price };
}

async function importBusData() {
  console.log('\nImporting Tamil bus data from Excel...\n');

  const rows = readExcelFile(getBusFilePath());
  console.log(`Found ${rows.length} bus rows in Excel`);

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const mapped = mapBusRow(row);
      const result = await pool.query(
        `INSERT INTO bus_routes (source, destination, distance_km, bus_type, price_inr)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (source, destination, bus_type) DO NOTHING`,
        [mapped.source, mapped.destination, mapped.distance, mapped.busType, mapped.price]
      );

      if (result.rowCount === 1) {
        inserted += 1;
      } else {
        skipped += 1;
      }
    } catch (err) {
      skipped += 1;
      console.error(`Skipped bus row: ${err.message}`);
    }
  }

  console.log(`Imported ${inserted} bus routes (${skipped} skipped)`);
}

async function importTrainData() {
  console.log('\nImporting Tamil train data from Excel...\n');

  const rows = readExcelFile(getTrainFilePath());
  console.log(`Found ${rows.length} train rows in Excel`);

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const mapped = mapTrainRow(row);
      const result = await pool.query(
        `INSERT INTO train_routes (source, destination, distance_km, train_type, train_number, price_inr)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (source, destination, train_number) DO NOTHING`,
        [
          mapped.source,
          mapped.destination,
          mapped.distance,
          mapped.trainType,
          mapped.trainNumber,
          mapped.price,
        ]
      );

      if (result.rowCount === 1) {
        inserted += 1;
      } else {
        skipped += 1;
      }
    } catch (err) {
      skipped += 1;
      console.error(`Skipped train row: ${err.message}`);
    }
  }

  console.log(`Imported ${inserted} train routes (${skipped} skipped)`);
}

async function showSummary() {
  console.log('\nDatabase summary:\n');

  const busCount = await pool.query('SELECT COUNT(*) AS count FROM bus_routes');
  const trainCount = await pool.query('SELECT COUNT(*) AS count FROM train_routes');
  console.log(`bus_routes : ${busCount.rows[0].count}`);
  console.log(`train_routes: ${trainCount.rows[0].count}`);

  const sampleBus = await pool.query('SELECT * FROM bus_routes ORDER BY id LIMIT 3');
  const sampleTrain = await pool.query('SELECT * FROM train_routes ORDER BY id LIMIT 3');

  console.log('\nSample bus routes:');
  sampleBus.rows.forEach(row => {
    console.log(`- ${row.source} -> ${row.destination} | ${row.bus_type} | Rs.${row.price_inr}`);
  });

  console.log('\nSample train routes:');
  sampleTrain.rows.forEach(row => {
    console.log(`- ${row.source} -> ${row.destination} | ${row.train_type} | ${row.train_number} | Rs.${row.price_inr}`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes('--delete');
  const shouldReset = args.includes('--reset');
  const dropUsers = args.includes('--drop-users');

  try {
    require.resolve('xlsx');
    console.log('Starting Tamil travel data import...\n');

    if (shouldReset) {
      await resetSchema({ dropUsers });
    } else {
      await createRouteTables();
      if (shouldDelete) {
        await truncateRouteData();
      }
    }

    await importBusData();
    await importTrainData();
    await showSummary();

    console.log('\nTamil travel data import completed successfully.');
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && String(err.message || '').includes('xlsx')) {
      console.error('xlsx is not installed. Run: cd backend && npm install xlsx');
      process.exit(1);
    }

    console.error('\nFatal error:', err.message);
    console.error('\nMake sure:');
    console.error('1. Excel files exist in the project root');
    console.error('2. PostgreSQL is running');
    console.error('3. DATABASE_URL is correct in backend/.env');
    console.error('4. xlsx is installed in backend/node_modules');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
