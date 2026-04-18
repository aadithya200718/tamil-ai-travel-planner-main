# Quick Commands Reference

## 🚀 Tamil Data Import

```bash
# Install required package
npm install xlsx

# Import Tamil bus & train data (delete old data first)
node backend/import-excel-data.js --delete

# Import without deleting
node backend/import-excel-data.js
```

---

## 🗑️ Delete Data

```bash
# Delete ALL data (users, bookings, queries, routes)
node backend/check-db.js --delete

# Delete only route data
node backend/import-excel-data.js --delete

# Drop all tables
node backend/check-db.js --drop
```

---

## 📊 Check Database

```bash
# Check tables and record counts
node backend/check-db.js

# Check specific table
psql -U postgres -d travelplanner -c "SELECT COUNT(*) FROM bus_routes;"
```

---

## 🔍 Query Data

```sql
-- Connect to database
psql -U postgres -d travelplanner

-- View bus routes
SELECT * FROM bus_routes WHERE source = 'சென்னை' LIMIT 5;

-- View train routes
SELECT * FROM train_routes WHERE source = 'சென்னை' LIMIT 5;

-- Count routes
SELECT COUNT(*) FROM bus_routes;
SELECT COUNT(*) FROM train_routes;

-- Exit
\q
```

---

## 🚀 Start Services

```bash
# Start backend
cd backend
node server.js

# Start frontend
cd frontend
npm run dev

# Start NLP service
cd nlp
python app.py
```

---

## 💳 Razorpay Setup

```bash
# Install Razorpay
cd backend
npm install razorpay

# Add to .env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Add to frontend/.env.local
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## 📦 Package Installation

```bash
# Backend packages
cd backend
npm install

# Frontend packages
cd frontend
npm install

# Python packages
cd nlp
pip install -r requirements.txt
```

---

## 🧪 Test Commands

```bash
# Test database connection
node backend/check-db.js

# Test translation
node backend/test-translation.js

# Test Razorpay (after integration)
# Use test card: 4111 1111 1111 1111
```

---

## 📝 Useful SQL Commands

```sql
-- List all tables
\dt

-- Describe table structure
\d bus_routes
\d train_routes

-- View all data
SELECT * FROM bus_routes;
SELECT * FROM train_routes;

-- Search routes
SELECT * FROM bus_routes WHERE source = 'சென்னை' AND destination = 'மதுரை';

-- Delete specific data
DELETE FROM bus_routes WHERE id = 1;

-- Truncate table
TRUNCATE TABLE bus_routes CASCADE;

-- Drop table
DROP TABLE bus_routes CASCADE;
```

---

## 🔧 Troubleshooting

```bash
# Check if PostgreSQL is running
psql --version

# Restart PostgreSQL (Windows)
net stop postgresql
net start postgresql

# Check Node.js version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall packages
rm -rf node_modules package-lock.json
npm install
```

---

## 📂 File Locations

```
Project Structure:
├── bus-dataset-tamil.xlsx          # Bus data
├── train-dataset-tamil.xlsx        # Train data
├── backend/
│   ├── server.js                   # Main server
│   ├── db.js                       # Database config
│   ├── check-db.js                 # Check database
│   ├── import-excel-data.js        # Import Tamil data
│   ├── .env                        # Environment variables
│   └── services/
│       ├── razorpayService.js      # Payment service
│       └── translationService.js   # Tamil translation
├── frontend/
│   ├── pages/
│   │   └── planner.js              # Main planner page
│   ├── components/
│   │   ├── RazorpayCheckout.js     # Payment component
│   │   └── BookingConfirmation.js  # Booking UI
│   └── .env.local                  # Frontend env
└── nlp/
    ├── app.py                      # NLP service
    └── transcribe.py               # Voice transcription
```

---

## ⚡ Quick Workflow

### **Fresh Setup:**
```bash
# 1. Install packages
cd backend && npm install
cd ../frontend && npm install
cd ../nlp && pip install -r requirements.txt

# 2. Setup database
node backend/check-db.js

# 3. Import Tamil data
npm install xlsx
node backend/import-excel-data.js --delete

# 4. Start services
# Terminal 1: cd backend && node server.js
# Terminal 2: cd frontend && npm run dev
# Terminal 3: cd nlp && python app.py
```

### **Reset Everything:**
```bash
# Delete all data
node backend/check-db.js --delete

# Re-import Tamil data
node backend/import-excel-data.js

# Restart backend
cd backend && node server.js
```

### **Update Routes Only:**
```bash
# Delete old routes
node backend/import-excel-data.js --delete

# Verify
node backend/check-db.js
```

---

## 🎯 Common Tasks

| Task | Command |
|------|---------|
| Import Tamil data | `node backend/import-excel-data.js --delete` |
| Check database | `node backend/check-db.js` |
| Delete all data | `node backend/check-db.js --delete` |
| Start backend | `cd backend && node server.js` |
| Start frontend | `cd frontend && npm run dev` |
| Connect to DB | `psql -U postgres -d travelplanner` |
| View routes | `SELECT * FROM bus_routes LIMIT 5;` |

---

**Save this file for quick reference!** 📌
