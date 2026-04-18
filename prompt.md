# Claude Opus Prompt for CONNECT.md Generation

Use this prompt with Claude Opus to generate comprehensive API integration documentation.

---

## Prompt

```
I have a Tamil AI Travel Planner application with the following architecture:

### Current Stack:
- **Frontend**: Next.js (React) with voice recording and Tamil UI
- **Backend**: Node.js + Express + PostgreSQL
- **NLP Service**: Python Flask with OpenAI Whisper for voice transcription
- **Translation Service**: Converts Tamil place names and budget terms to English
- **Database**: PostgreSQL with queries, itineraries, and bookings tables

### Current Data Flow:
1. User inputs Tamil query: "சென்னை இருந்து மதுரை குறைந்த விலையில்"
2. NLP extracts entities: {source: "சென்னை", destination: "மதுரை", budget: "குறைந்த விலை"}
3. Translation converts: {source: "Chennai", destination: "Madurai", budget: "low"}
4. Currently uses MOCK data from travelService.js
5. Need to replace with REAL API calls

---

## APIs to Integrate

### 1. Sky Scrapper API (RapidAPI) - Real Flight Data

```python
import http.client

conn = http.client.HTTPSConnection("sky-scrapper.p.rapidapi.com")

headers = {
    'x-rapidapi-key': "YOUR_NEW_KEY",
    'x-rapidapi-host': "sky-scrapper.p.rapidapi.com"
}

conn.request("GET", "/api/v2/flights/searchFlightsComplete?originSkyId=LOND&destinationSkyId=NYCA&originEntityId=27544008&destinationEntityId=27537542&cabinClass=economy&adults=1", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

### 2. IRCTC API (RapidAPI) - Real Train Data

```python
import http.client

conn = http.client.HTTPSConnection("irctc1.p.rapidapi.com")

headers = {
    'x-rapidapi-key': "YOUR_NEW_KEY",
    'x-rapidapi-host': "irctc1.p.rapidapi.com"
}

conn.request("GET", "/api/v3/getLiveStation?hours=1", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

---

## Task: Create CONNECT.md

Generate a comprehensive, beginner-friendly CONNECT.md file that explains how to integrate these RapidAPI services into the Tamil AI Travel Planner.

### Required Sections:

#### 1. **Setup API Keys**
- Where to create .env files (nlp/.env and backend/.env)
- What environment variables to add
- How to get RapidAPI key from https://rapidapi.com/

#### 2. **Python API Service (nlp/api_service.py)**
Create complete code for:
- `search_flights()` function using Sky Scrapper API
- `get_live_trains()` function using IRCTC API
- `search_trains_between_stations()` function
- `get_real_travel_options()` function that combines both APIs
- City-to-airport mapping dictionary (Chennai, Madurai, Coimbatore, Bangalore, Mumbai, Delhi)
- City-to-station mapping dictionary (MAS, MDU, CBE, TPJ, SBC, CSTM, NDLS)
- Error handling and fallback logic
- Test script at the bottom

#### 3. **Update NLP Flask App (nlp/app.py)**
- Add new `/travel-options` POST endpoint
- Accept: `{"source": "Chennai", "destination": "Madurai", "budget": "low"}`
- Call `get_real_travel_options()` from api_service.py
- Return combined flight and train data
- Include error handling

#### 4. **Backend Real Travel Service (backend/services/realTravelService.js)**
Create complete Node.js code for:
- `getRealTravelOptions()` function
- Calls NLP service `/travel-options` endpoint using axios
- Timeout handling (15 seconds)
- Fallback to mock data if API fails
- Export function for use in server.js

#### 5. **Update Backend Server (backend/server.js)**
Show how to:
- Import `getRealTravelOptions` from realTravelService.js
- Update `processQuery()` function to use real APIs
- Keep fallback to mock data
- Handle API errors gracefully
- Maintain existing translation flow

#### 6. **City Code Reference Tables**
Provide tables for:
- **Airports**: City | Sky ID | Entity ID | IATA Code
- **Train Stations**: City | Station Code
- Include at least: Chennai, Madurai, Coimbatore, Trichy, Bangalore, Mumbai, Delhi

#### 7. **Complete Data Flow Diagram**
Show the flow:
```
User Input (Tamil)
    ↓
Backend /query endpoint
    ↓
NLP Service /nlp (extract entities)
    ↓
Translation Service (Tamil → English)
    ↓
NLP Service /travel-options
    ↓
RapidAPI (Sky Scrapper + IRCTC)
    ↓
Real Flight & Train Data
    ↓
Backend (format & save)
    ↓
Frontend (display in Tamil)
```

#### 8. **Installation & Dependencies**
- Python: `pip install python-dotenv`
- Node.js: Already has axios
- Update requirements.txt

#### 9. **Testing Instructions**
Step-by-step testing:
- Test Python API service directly
- Test Flask endpoint with curl
- Test backend endpoint with curl
- Test full flow from frontend
- Include example curl commands

#### 10. **Troubleshooting Section**
Common issues:
- API returns empty data
- Connection timeout
- Invalid response format
- Rate limit exceeded
- API key issues

#### 11. **Cost Optimization Tips**
- Cache API responses for popular routes
- Use mock data for development
- Implement request throttling
- Monitor API usage dashboard
- Consider paid tier for production

#### 12. **Important Notes**
- API rate limits on free tier
- Fallback to mock data if API fails
- Need to update airport/station codes
- Error handling is critical
- Always handle timeouts

---

## Output Requirements:

1. **Complete, runnable code** - No placeholders or "TODO" comments
2. **Beginner-friendly** - Explain each step clearly
3. **Copy-paste ready** - Code should work with minimal changes
4. **Well-structured** - Use markdown headers, code blocks, tables
5. **Comprehensive** - Cover setup, implementation, testing, troubleshooting
6. **Production-ready** - Include error handling, fallbacks, logging

---

## Code Style Guidelines:

### Python:
- Use type hints where appropriate
- Include docstrings for functions
- Handle exceptions gracefully
- Use environment variables for secrets
- Follow PEP 8 style guide

### JavaScript:
- Use async/await for promises
- Include JSDoc comments
- Use const/let (no var)
- Handle errors with try/catch
- Use template literals for strings

---

## Example Code Structure:

The CONNECT.md should include complete code files like:

```python
# nlp/api_service.py
"""
api_service.py - Fetch real flight and train data from RapidAPI
"""

import http.client
import json
import os
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY', 'YOUR_NEW_KEY')
# ... rest of the code
```

```javascript
// backend/services/realTravelService.js
const axios = require('axios');

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:5000';

async function getRealTravelOptions(source, destination, budget = 'medium') {
  // ... implementation
}

module.exports = { getRealTravelOptions };
```

---

## Target Audience:

- Junior to mid-level developers
- Familiar with Node.js and Python basics
- May not have API integration experience
- Need clear, step-by-step instructions

---

Generate the complete CONNECT.md file now.
```

---

## How to Use This Prompt

1. Copy the entire prompt above
2. Paste it into Claude Opus (or Claude Sonnet 3.5)
3. Claude will generate a comprehensive CONNECT.md file
4. Review and customize the output for your specific needs
5. Save as CONNECT.md in your project root

---

## Expected Output

The generated CONNECT.md will include:

- ✅ Complete Python API service code
- ✅ Flask endpoint implementation
- ✅ Node.js backend service code
- ✅ Server.js integration updates
- ✅ City code mapping tables
- ✅ Data flow diagrams
- ✅ Testing instructions
- ✅ Troubleshooting guide
- ✅ Cost optimization tips
- ✅ Environment setup guide

---

## Customization Tips

After generating, you can customize:

1. **Add more cities**: Update city mapping dictionaries
2. **Add more APIs**: Follow the same pattern for bus/hotel APIs
3. **Change API providers**: Replace RapidAPI with other providers
4. **Add caching**: Implement Redis or in-memory caching
5. **Add monitoring**: Integrate logging and error tracking

---

## Related Files

After generating CONNECT.md, you may also want to create:

- `API_REFERENCE.md` - Detailed API endpoint documentation
- `DEPLOYMENT.md` - Production deployment guide
- `TESTING.md` - Comprehensive testing guide
- `ARCHITECTURE.md` - System architecture overview

---

## Notes

- This prompt is optimized for Claude Opus/Sonnet 3.5
- Adjust complexity based on your team's skill level
- Include actual API documentation links if available
- Test all generated code before using in production
- Keep API keys secure and never commit to git

---

## Version History

- v1.0 (2024) - Initial prompt for RapidAPI integration
- Future: Add support for more travel APIs (hotels, buses, car rentals)
