# Tamil Bus & Train Data Import Guide

## 📋 Overview

This guide will help you import Tamil bus and train dataset into your PostgreSQL database.

---

## 🚀 Quick Start (3 Steps)

### **Step 1: Install Required Package**

```bash
cd backend
npm install xlsx
```

### **Step 2: Place Excel Files**

Make sure these files are in your project root:
- `bus-dataset-tamil.xlsx`
- `train-dataset-tamil.xlsx`

### **Step 3: Import Data**

```bash
# Delete old data and import new data
node backend/import-excel-data.js --delete

# Or just add new data (keep existing)
node backend/import-excel-data.js
```

---

## 📊 What Gets Created

### **Tables:**

1. **`bus_routes`** - Tamil bus routes
   - source (சென்னை, மதுரை, etc.)
   - destination
   - distance_km
   - bus_type (ஸ்லீப்பர், எக்ஸ்பிரஸ், ஏசி, சாதாரண)
   - price_inr

2. **`train_routes`** - Tamil train routes
   - source
   - destination
   - distance_km
   - train_type (சூப்பர்ஃபாஸ்ட், பேஸஞ்சர், எக்ஸ்பிரஸ்)
   - train_number
   - price_inr

---

## 🗑️ Delete Old Data

### **Option 1: Delete All Travel Data**

```bash
node backend/check-db.js --delete
```

This deletes:
- All queries
- All itineraries
- All bookings
- All users

### **Option 2: Delete Only Route Data**

```bash
node backend/import-excel-data.js --delete
```

This deletes only:
- Bus routes
- Train routes

### **Option 3: Manual SQL Delete**

```sql
-- Connect to database
psql -U postgres -d travelplanner

-- Delete route data
DELETE FROM bus_routes;
DELETE FROM train_routes;

-- Delete booking data
TRUNCATE TABLE bus_bookings CASCADE;
TRUNCATE TABLE train_bookings CASCADE;
TRUNCATE TABLE flight_bookings CASCADE;
TRUNCATE TABLE hotel_bookings CASCADE;

-- Delete query data
TRUNCATE TABLE itineraries CASCADE;
TRUNCATE TABLE queries CASCADE;

-- Delete user data
TRUNCATE TABLE users CASCADE;
```

---

## 📈 Verify Import

### **Check Data Count:**

```bash
node backend/check-db.js
```

### **Manual SQL Check:**

```sql
-- Count routes
SELECT 'bus_routes' as table_name, COUNT(*) as count FROM bus_routes
UNION ALL
SELECT 'train_routes', COUNT(*) FROM train_routes;

-- View sample bus routes
SELECT * FROM bus_routes LIMIT 5;

-- View sample train routes
SELECT * FROM train_routes LIMIT 5;

-- Check specific route
SELECT * FROM bus_routes WHERE source = 'சென்னை' AND destination = 'மதுரை';
```

---

## 🔍 Query Examples

### **Find Bus Routes:**

```sql
-- Chennai to Madurai buses
SELECT * FROM bus_routes 
WHERE source = 'சென்னை' AND destination = 'மதுரை'
ORDER BY price_inr;

-- All routes from Chennai
SELECT * FROM bus_routes 
WHERE source = 'சென்னை'
ORDER BY destination;

-- Cheapest buses
SELECT * FROM bus_routes 
ORDER BY price_inr 
LIMIT 10;

-- AC buses only
SELECT * FROM bus_routes 
WHERE bus_type = 'ஏசி'
ORDER BY price_inr;
```

### **Find Train Routes:**

```sql
-- Chennai to Madurai trains
SELECT * FROM train_routes 
WHERE source = 'சென்னை' AND destination = 'மதுரை'
ORDER BY price_inr;

-- Superfast trains
SELECT * FROM train_routes 
WHERE train_type = 'சூப்பர்ஃபாஸ்ட்'
ORDER BY price_inr;

-- Specific train number
SELECT * FROM train_routes 
WHERE train_number = '12000';
```

---

## 🔧 Integrate with Your API

### **Update travelService.js:**

```javascript
// backend/services/travelService.js

const { getDb } = require('../db');

async function getTamilBusOptions(source, destination) {
  const db = await getDb();
  
  const result = await db.query(
    `SELECT * FROM bus_routes 
     WHERE source = $1 AND destination = $2
     ORDER BY price_inr`,
    [source, destination]
  );
  
  return result.rows.map(row => ({
    type: 'bus',
    name: `${row.source} to ${row.destination} ${row.bus_type}`,
    price: row.price_inr,
    duration: `${Math.round(row.distance_km / 50)}h`, // Estimate
    distance: `${row.distance_km}km`,
    busType: row.bus_type,
  }));
}

async function getTamilTrainOptions(source, destination) {
  const db = await getDb();
  
  const result = await db.query(
    `SELECT * FROM train_routes 
     WHERE source = $1 AND destination = $2
     ORDER BY price_inr`,
    [source, destination]
  );
  
  return result.rows.map(row => ({
    type: 'train',
    name: `Train ${row.train_number} - ${row.train_type}`,
    price: row.price_inr,
    duration: `${Math.round(row.distance_km / 60)}h`, // Estimate
    distance: `${row.distance_km}km`,
    trainNumber: row.train_number,
    trainType: row.train_type,
  }));
}

module.exports = {
  getTamilBusOptions,
  getTamilTrainOptions,
};
```

### **Update server.js:**

```javascript
// backend/server.js

const { getTamilBusOptions, getTamilTrainOptions } = require('./services/travelService');

// Add route to search Tamil routes
app.post('/search-routes', async (req, res) => {
  try {
    const { source, destination, mode } = req.body;
    
    let results = [];
    
    if (mode === 'bus' || mode === 'all') {
      const buses = await getTamilBusOptions(source, destination);
      results = [...results, ...buses];
    }
    
    if (mode === 'train' || mode === 'all') {
      const trains = await getTamilTrainOptions(source, destination);
      results = [...results, ...trains];
    }
    
    res.json({
      success: true,
      source,
      destination,
      results,
      count: results.length,
    });
  } catch (err) {
    console.error('Search routes error:', err);
    res.status(500).json({ error: 'தேடல் தோல்வியடைந்தது' });
  }
});
```

---

## 📊 Data Statistics

### **Your Dataset Contains:**

- **Bus Routes**: ~90 routes
- **Train Routes**: ~90 routes
- **Cities Covered**: 10 major Tamil Nadu cities
  - சென்னை (Chennai)
  - கோயம்புத்தூர் (Coimbatore)
  - மதுரை (Madurai)
  - திருச்சி (Trichy)
  - சேலம் (Salem)
  - ஈரோடு (Erode)
  - திருநெல்வேலி (Tirunelveli)
  - வேலூர் (Vellore)
  - தூத்துக்குடி (Tuticorin)
  - திண்டுக்கல் (Dindigul)

### **Bus Types:**
- ஸ்லீப்பர் (Sleeper)
- எக்ஸ்பிரஸ் (Express)
- ஏசி (AC)
- சாதாரண (Ordinary)

### **Train Types:**
- சூப்பர்ஃபாஸ்ட் (Superfast)
- பேஸஞ்சர் (Passenger)
- எக்ஸ்பிரஸ் (Express)

---

## 🔄 Update Data

### **To Update Existing Data:**

1. Edit your Excel files
2. Run import with --delete flag:

```bash
node backend/import-excel-data.js --delete
```

### **To Add New Routes:**

1. Add rows to Excel files
2. Run import without --delete:

```bash
node backend/import-excel-data.js
```

---

## ⚠️ Troubleshooting

### **Error: xlsx package not found**

```bash
cd backend
npm install xlsx
```

### **Error: Excel file not found**

Make sure files are in project root:
```
your-project/
├── bus-dataset-tamil.xlsx
├── train-dataset-tamil.xlsx
├── backend/
│   └── import-excel-data.js
```

### **Error: Database connection failed**

Check your `.env` file:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/travelplanner
```

### **Error: Permission denied**

Make sure PostgreSQL is running:
```bash
# Windows
net start postgresql

# Mac/Linux
sudo service postgresql start
```

---

## 📝 Complete Workflow

### **1. Fresh Start (Delete Everything):**

```bash
# Delete all data
node backend/check-db.js --delete

# Import Tamil routes
node backend/import-excel-data.js

# Verify
node backend/check-db.js
```

### **2. Keep Users, Replace Routes:**

```bash
# Delete only route data
node backend/import-excel-data.js --delete

# Verify
node backend/check-db.js
```

### **3. Add More Routes:**

```bash
# Just import (no delete)
node backend/import-excel-data.js
```

---

## ✅ Checklist

- [ ] Install xlsx package: `npm install xlsx`
- [ ] Place Excel files in project root
- [ ] Run import script: `node backend/import-excel-data.js --delete`
- [ ] Verify data: `node backend/check-db.js`
- [ ] Test API: Search for routes
- [ ] Update travelService.js to use Tamil data
- [ ] Test booking flow with Tamil routes

---

## 🎯 Next Steps

1. ✅ Import Tamil data
2. Update `travelService.js` to query `bus_routes` and `train_routes` tables
3. Update `translationService.js` to handle Tamil city names
4. Test search with Tamil voice input
5. Test booking with Tamil routes
6. Integrate Razorpay payment

---

**Total Time**: ~5 minutes to import all data! 🚀
