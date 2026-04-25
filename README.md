# Tamil AI Travel Planner

An AI-powered full-stack web application that helps users plan travel itineraries across Tamil Nadu using natural language (text or voice input in Tamil/English).



## Architecture

```
tamil-ai-travel-planner/
  frontend/        — Next.js (React) UI with voice recording, booking & TTS
  backend/         — Node.js + Express REST API + SQLite
  nlp/             — Python Flask NLP + Whisper transcription microservice
  database/        — SQLite database file (auto-created at runtime)
  README.md
```

### Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | Next.js 14, React 18, Browser MediaRecorder API, Web Speech API |
| Backend   | Node.js, Express, better-sqlite3, multer |
| NLP       | Python 3.10+, Flask 3, OpenAI Whisper (local), regex-based intent detection |
| Database  | SQLite (via better-sqlite3) |

---

## Features

- 🗣️ **Tamil Voice Input** — record audio and transcribe using local Whisper (no API key needed)
- ⌨️ **Text Input** — type queries in Tamil or English
- 🌐 **Smart Translation** — automatically translates Tamil place names and budget terms to English for database queries
- 🤖 **Intent Detection** — keyword-based NLP for Tamil travel vocabulary
- 📍 **Entity Extraction** — source city, destination city, travel date, budget
- 💰 **Budget-Aware Search** — supports Tamil budget terms (குறைந்த விலை, மலிவான, லக்ஷரி) and numeric prices
- 🗺️ **Itinerary Generation** — Tamil-language day plans and travel option summaries
- 🎫 **Mock Booking System** — book travel options with confirmation ID and PNR
- 💰 **Conditional Cancellation** — refund policy based on timing (100% / 50% / 0%)
- 🔊 **Text-to-Speech** — reads itinerary aloud using `window.speechSynthesis`
- 👴 **Elderly-Friendly Mode** — larger text, bigger buttons, simplified layout
- 💾 **Persistent Storage** — all queries, itineraries, and bookings saved to SQLite
- 🕒 **Recent History** — view your last 10 travel plans

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- **ffmpeg** (required for Whisper audio conversion)

### Install ffmpeg

```bash
# Windows
choco install ffmpeg
# or download from https://ffmpeg.org/download.html

# macOS
brew install ffmpeg

# Linux (Ubuntu/Debian)
sudo apt-get install ffmpeg
```

### 1. Clone the repository

```bash
git clone https://github.com/DhritiGupta2006/tamil-ai-travel-planner.git
cd tamil-ai-travel-planner
```

### 2. Start the NLP Service (Python Flask — port 5000)

```bash
cd nlp
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

> **Note:** On first run, Whisper will download the `base` model (~74MB). Set `WHISPER_MODEL_SIZE=small` env var for better accuracy (244MB download).

### 3. Start the Backend (Node.js — port 3001)

```bash
cd backend
npm install
npm start
```

### 4. Start the Frontend (Next.js — port 3000)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Reference

### Backend (Express — `http://localhost:3001`)

| Method | Path                  | Description |
|--------|-----------------------|-------------|
| GET    | /health               | Returns `{"status":"ok"}` |
| GET    | /recent               | Returns last 10 queries + itineraries |
| POST   | /query                | `{"text":"..."}` → NLP + itinerary generation |
| POST   | /voice                | Multipart `audio` file → Whisper transcription + itinerary |
| POST   | /search               | `{"query":"சென்னை"}` → Translates Tamil to English |
| POST   | /book                 | `{travelOption, passengers, contactPhone}` → booking confirmation |
| GET    | /booking/:id          | Get booking details by booking ID |
| POST   | /booking/:id/cancel   | Cancel booking (conditional refund) |
| GET    | /bookings             | List all bookings |

### NLP Service (Flask — `http://localhost:5000`)

| Method | Path        | Description |
|--------|-------------|-------------|
| GET    | /health     | Returns `{"status":"ok"}` |
| POST   | /nlp        | `{"text":"..."}` → `{"intent":"...","entities":{...}}` |
| POST   | /transcribe | Multipart `audio` file → `{"text":"...","language":"ta","confidence":0.95}` |

**Intent values:** `plan_trip` · `get_routes` · `get_budget_trip` · `get_places`

**Entity fields:** `source` · `destination` · `date` · `budget`

---

## Booking System

### Booking Flow
1. Generate an itinerary (text or voice)
2. Click "🎫 பதிவு செய்" on any travel option
3. Enter passengers (1–6) and phone number (10 digits)
4. Click "✓ உறுதி செய்யுங்கள்" to confirm
5. Receive booking ID (TN1001, TN1002...) and PNR

### Cancellation Policy
| Timing | Refund |
|--------|--------|
| Within 1 hour of booking | 100% (full refund) |
| 1–24 hours after booking | 50% refund |
| After 24 hours | No refund |
| Travel date passed | Cannot cancel |

---

## Elderly-Friendly Mode

Toggle the "👴 பெரிய எழுத்து" button in the header to enable:
- **Larger text** — 18px base, 20px inputs, 36px headings
- **Bigger buttons** — 60px min-height, 120px min-width
- **Higher contrast** — for better readability
- **Simplified layout** — recent queries hidden
- **Focus outlines** — for keyboard navigation

Preference is saved in `localStorage` and persists across page reloads.

---

## Database Schema

```sql
CREATE TABLE queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transcript TEXT NOT NULL,
  intent TEXT,
  entities TEXT,           -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE itineraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_id INTEGER NOT NULL REFERENCES queries(id),
  itinerary_text TEXT NOT NULL,
  travel_options TEXT,     -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT UNIQUE NOT NULL,    -- TN1001, TN1002, ...
  user_id TEXT NOT NULL,
  travel_type TEXT NOT NULL,
  travel_name TEXT NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  travel_date TEXT,
  passengers INTEGER NOT NULL,
  price_per_person INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  contact_phone TEXT NOT NULL,
  pnr TEXT NOT NULL,                  -- PNR + 9 alphanumeric
  status TEXT NOT NULL DEFAULT 'confirmed',
  refund_amount INTEGER DEFAULT 0,
  cancelled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Example Queries

- `Chennai இருந்து Madurai பயண திட்டம் தேவை`
- `சென்னை இருந்து மதுரை குறைந்த விலையில் செல்ல வேண்டும்` (with budget)
- `கோவை லிருந்து ஊட்டி மலிவான பயணம்` (cheap travel)
- `Ooty க்கு பட்ஜெட் trip plan`
- `மதுரை லிருந்து ராமேஸ்வரம் லக்ஷரி` (luxury travel)
- `Chennai to தேனி 500 ரூபாய்க்குள்` (with price limit)
- `Rameswaram tourist places`
- `I want to travel from Trichy to Kanyakumari`

### Translation Feature

The app now automatically translates Tamil place names and budget terms to English for database queries:

**Place Names:**
- சென்னை → Chennai
- மதுரை → Madurai
- கோவை → Coimbatore

**Budget Terms:**
- குறைந்த விலை / மலிவான / பட்ஜெட் → low
- நடுத்தர விலை → medium
- லக்ஷரி / ஆடம்பரமான → high

See `backend/TRANSLATION_GUIDE.md` for complete documentation.

---

## Environment Variables

### backend/.env

| Variable          | Default                    | Description |
|-------------------|----------------------------|-------------|
| `PORT`            | `3001`                     | Backend port |
| `NLP_SERVICE_URL` | `http://localhost:5000`    | URL of the Flask NLP service |
| `DB_PATH`         | `../database/travel.db`    | SQLite file path (relative to backend/) |

### nlp/ environment

| Variable             | Default | Description |
|----------------------|---------|-------------|
| `WHISPER_MODEL_SIZE` | `base`  | Whisper model: `tiny`, `base`, `small`, `medium` |

### frontend/.env.local

| Variable                   | Default                  |
|----------------------------|--------------------------|
| `NEXT_PUBLIC_BACKEND_URL`  | `http://localhost:3001`  |

---

## Troubleshooting

### Whisper Installation Issues
```bash
pip install --upgrade pip
pip install openai-whisper --no-cache-dir
```

### ffmpeg Not Found
Install ffmpeg for your OS (see installation commands in Prerequisites section).

### Voice Transcription Returns Empty
- Check audio is not silence
- Verify ffmpeg is installed
- Try a different Whisper model: `WHISPER_MODEL_SIZE=small python app.py`

### Booking Not Saving
- Check database file permissions
- Delete `database/travel.db` to recreate schema
- Check backend console logs for SQL errors

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License — see the [LICENSE](LICENSE) file for details.