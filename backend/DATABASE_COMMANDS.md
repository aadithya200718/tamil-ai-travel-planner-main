# PostgreSQL Database Commands

## Tables in Your Database

Your Tamil AI Travel Planner has these tables:

1. **`users`** - User accounts (name, email, phone, password)
2. **`queries`** - Search queries (Tamil voice/text input)
3. **`itineraries`** - Travel plans generated
4. **`bus_bookings`** - Bus ticket bookings
5. **`train_bookings`** - Train ticket bookings
6. **`flight_bookings`** - Flight bookings
7. **`hotel_bookings`** - Hotel bookings

---

## Method 1: Using Node.js Script (Easiest) ✅

### Check Tables and Data
```bash
node backend/check-db.js
```

### Delete All Data (keeps table structure)
```bash
node backend/check-db.js --delete
```

### Drop All Tables (removes everything)
```bash
node backend/check-db.js --drop
```

---

## Method 2: Using psql Command Line

### Connect to Database
```bash
psql -U postgres -d travelplanner
```

### Check if Tables Exist
```sql
\dt
```

### Count Records in Each Table
```sql
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'queries', COUNT(*) FROM queries
UNION ALL
SELECT 'itineraries', COUNT(*) FROM itineraries
UNION ALL
SELECT 'bus_bookings', COUNT(*) FROM bus_bookings
UNION ALL
SELECT 'train_bookings', COUNT(*) FROM train_bookings
UNION ALL
SELECT 'flight_bookings', COUNT(*) FROM flight_bookings
UNION ALL
SELECT 'hotel_bookings', COUNT(*) FROM hotel_bookings;
```

### View Sample Tamil Queries
```sql
SELECT id, transcript, intent, entities, created_at 
FROM queries 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Delete Data Commands

### Option A: Delete All Data (keeps tables)
```sql
TRUNCATE TABLE hotel_bookings CASCADE;
TRUNCATE TABLE flight_bookings CASCADE;
TRUNCATE TABLE train_bookings CASCADE;
TRUNCATE TABLE bus_bookings CASCADE;
TRUNCATE TABLE itineraries CASCADE;
TRUNCATE TABLE queries CASCADE;
TRUNCATE TABLE users CASCADE;
```

### Option B: Delete Old Data (older than 7 days)
```sql
DELETE FROM queries WHERE created_at < NOW() - INTERVAL '7 days';
DELETE FROM itineraries WHERE created_at < NOW() - INTERVAL '7 days';
```

### Option C: Delete Specific Records
```sql
-- Delete specific query
DELETE FROM queries WHERE id = 1;

-- Delete queries from specific user
DELETE FROM queries WHERE transcript LIKE '%சென்னை%';
```

---

## Drop Tables (Complete Removal)

⚠️ **WARNING**: This removes table structure completely!

```sql
DROP TABLE IF EXISTS hotel_bookings CASCADE;
DROP TABLE IF EXISTS flight_bookings CASCADE;
DROP TABLE IF EXISTS train_bookings CASCADE;
DROP TABLE IF EXISTS bus_bookings CASCADE;
DROP TABLE IF EXISTS itineraries CASCADE;
DROP TABLE IF EXISTS queries CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

After dropping, restart your backend server to recreate tables:
```bash
cd backend
node server.js
```

---

## Reset Auto-Increment IDs

After deleting data, reset ID sequences:

```sql
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE queries_id_seq RESTART WITH 1;
ALTER SEQUENCE itineraries_id_seq RESTART WITH 1;
ALTER SEQUENCE bus_bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE train_bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE flight_bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE hotel_bookings_id_seq RESTART WITH 1;
```

---

## Useful Queries

### View All Tamil Queries
```sql
SELECT * FROM queries ORDER BY created_at DESC;
```

### View Queries with Translations
```sql
SELECT 
  id,
  transcript,
  entities::json->>'source' as tamil_source,
  entities::json->>'destination' as tamil_destination,
  created_at
FROM queries
ORDER BY created_at DESC;
```

### Count Queries by Intent
```sql
SELECT intent, COUNT(*) as count 
FROM queries 
GROUP BY intent 
ORDER BY count DESC;
```

### View Recent Bookings
```sql
SELECT * FROM bus_bookings ORDER BY created_at DESC LIMIT 10;
SELECT * FROM train_bookings ORDER BY created_at DESC LIMIT 10;
SELECT * FROM flight_bookings ORDER BY created_at DESC LIMIT 10;
```

---

## Database Connection Info

Default connection (from `.env`):
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/travelplanner
```

- **Host**: localhost
- **Port**: 5432
- **Database**: travelplanner
- **User**: postgres
- **Password**: postgres

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `\dt` | List all tables |
| `\d table_name` | Describe table structure |
| `\q` | Quit psql |
| `SELECT * FROM queries LIMIT 5;` | View first 5 queries |
| `TRUNCATE TABLE queries;` | Delete all queries |
| `DROP TABLE queries;` | Remove queries table |

---

## Backup & Restore

### Backup Database
```bash
pg_dump -U postgres travelplanner > backup.sql
```

### Restore Database
```bash
psql -U postgres travelplanner < backup.sql
```

---

## Need Help?

Run the check script to see current state:
```bash
node backend/check-db.js
```
