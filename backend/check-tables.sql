-- ============================================
-- PostgreSQL Table Check & Data Deletion Script
-- ============================================

-- 1. LIST ALL TABLES
\dt

-- 2. CHECK IF SPECIFIC TABLES EXIST
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. COUNT RECORDS IN EACH TABLE
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

-- 4. VIEW SAMPLE DATA FROM QUERIES TABLE (Tamil data)
SELECT id, transcript, intent, entities, created_at 
FROM queries 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================
-- DELETE DATA (CAREFUL - THIS REMOVES DATA!)
-- ============================================

-- Option A: DELETE ALL DATA FROM ALL TABLES (keeps table structure)
-- TRUNCATE TABLE hotel_bookings CASCADE;
-- TRUNCATE TABLE flight_bookings CASCADE;
-- TRUNCATE TABLE train_bookings CASCADE;
-- TRUNCATE TABLE bus_bookings CASCADE;
-- TRUNCATE TABLE itineraries CASCADE;
-- TRUNCATE TABLE queries CASCADE;
-- TRUNCATE TABLE users CASCADE;

-- Option B: DELETE SPECIFIC DATA
-- DELETE FROM queries WHERE created_at < NOW() - INTERVAL '7 days';
-- DELETE FROM itineraries WHERE created_at < NOW() - INTERVAL '7 days';

-- Option C: DROP TABLES COMPLETELY (removes table structure)
-- DROP TABLE IF EXISTS hotel_bookings CASCADE;
-- DROP TABLE IF EXISTS flight_bookings CASCADE;
-- DROP TABLE IF EXISTS train_bookings CASCADE;
-- DROP TABLE IF EXISTS bus_bookings CASCADE;
-- DROP TABLE IF EXISTS itineraries CASCADE;
-- DROP TABLE IF EXISTS queries CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- RESET AUTO-INCREMENT SEQUENCES
-- ============================================
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE queries_id_seq RESTART WITH 1;
-- ALTER SEQUENCE itineraries_id_seq RESTART WITH 1;
-- ALTER SEQUENCE bus_bookings_id_seq RESTART WITH 1;
-- ALTER SEQUENCE train_bookings_id_seq RESTART WITH 1;
-- ALTER SEQUENCE flight_bookings_id_seq RESTART WITH 1;
-- ALTER SEQUENCE hotel_bookings_id_seq RESTART WITH 1;
