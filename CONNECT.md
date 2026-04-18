# 🌐 Integrating Real Travel APIs (RapidAPI)

This guide provides step-by-step instructions for integrating real-time flight (Sky Scrapper) and train (IRCTC) APIs into the Tamil AI Travel Planner.

## 1. Setup API Keys

First, you need to sign up at [RapidAPI](https://rapidapi.com/) and subscribe to the two APIs:
- [Sky Scrapper API](https://rapidapi.com/sky-scrapper/api/sky-scrapper/)
- [IRCTC API](https://rapidapi.com/irctc/api/irctc1/)

Once you have your API key, add it to your `.env` files.

**In `nlp/.env` and `backend/.env`:**
```ini
RAPIDAPI_KEY=aaa431301fmsh4120654a2d2ed01p11893ajsn31f003af1ac7
```

---

## 2. Python API Service (`nlp/api_service.py`)

Create a new file `nlp/api_service.py`. This file handles direct communication with RapidAPI.

```python
"""
api_service.py - Fetch real flight and train data from RapidAPI
"""
import http.client
import json
import os
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY', 'aaa431301fmsh4120654a2d2ed01p11893ajsn31f003af1ac7')

# City to Sky Scrapper Airport mapping
AIRPORT_MAP = {
    "Chennai": {"skyId": "MAA", "entityId": "27544045"},
    "Madurai": {"skyId": "IXM", "entityId": "27539665"},
    "Coimbatore": {"skyId": "CJB", "entityId": "27544055"},
    "Bangalore": {"skyId": "BLR", "entityId": "27544026"},
    "Mumbai": {"skyId": "BOM", "entityId": "27544008"},
    "Delhi": {"skyId": "DEL", "entityId": "27544015"}
}

# City to IRCTC Station mapping
STATION_MAP = {
    "Chennai": "MAS",
    "Madurai": "MDU",
    "Coimbatore": "CBE",
    "Trichy": "TPJ",
    "Bangalore": "SBC",
    "Mumbai": "CSTM",
    "Delhi": "NDLS"
}

def search_flights(source: str, destination: str):
    """Fetch flight data from Sky Scrapper API."""
    src = AIRPORT_MAP.get(source)
    dst = AIRPORT_MAP.get(destination)
    if not src or not dst: return []

    conn = http.client.HTTPSConnection("sky-scrapper.p.rapidapi.com")
    headers = {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': "sky-scrapper.p.rapidapi.com",
        'Content-Type': "application/json"
    }

    url = f"/api/v2/flights/searchFlightsComplete?originSkyId={src['skyId']}&destinationSkyId={dst['skyId']}&originEntityId={src['entityId']}&destinationEntityId={dst['entityId']}&cabinClass=economy&adults=1&sortBy=best"
    
    try:
        conn.request("GET", url, headers=headers)
        res = conn.getresponse()
        data = json.loads(res.read().decode("utf-8"))
        return data.get('data', {}).get('itineraries', [])
    except Exception as e:
        print(f"Flight API Error: {e}")
        return []

def search_trains_between_stations(source: str, destination: str):
    """Fetch live train data using IRCTC API."""
    # Note: Using getLiveStation as an example, for full routing use the proper endpoint
    src_station = STATION_MAP.get(source)
    if not src_station: return []

    conn = http.client.HTTPSConnection("irctc1.p.rapidapi.com")
    headers = {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': "irctc1.p.rapidapi.com",
        'Content-Type': "application/json"
    }

    try:
        conn.request("GET", f"/api/v3/getLiveStation?hours=2&stationCode={src_station}", headers=headers)
        res = conn.getresponse()
        data = json.loads(res.read().decode("utf-8"))
        return data.get('data', [])
    except Exception as e:
        print(f"Train API Error: {e}")
        return []

def get_real_travel_options(source: str, destination: str, budget: str = "medium"):
    """Combine both APIs with fallback."""
    flights = search_flights(source, destination)
    trains = search_trains_between_stations(source, destination)
    
    return {
        "source": source,
        "destination": destination,
        "budget": budget,
        "flightOptions": flights[:3], # Return top 3 flights
        "trainOptions": trains[:3]    # Return top 3 trains
    }

if __name__ == '__main__':
    print(json.dumps(get_real_travel_options("Chennai", "Madurai"), indent=2))
```

---

## 3. Update NLP Flask App (`nlp/app.py`)

Open `nlp/app.py` and map the new API service to an endpoint:

```python
from flask import Flask, request, jsonify
from api_service import get_real_travel_options

app = Flask(__name__)

# ... existing routes ...

@app.post("/travel-options")
def travel_options():
    try:
        data = request.get_json(silent=True)
        source = data.get("source", "")
        destination = data.get("destination", "")
        budget = data.get("budget", "medium")
        
        if not source or not destination:
            return jsonify({"error": "Source and destination required"}), 400
            
        options = get_real_travel_options(source, destination, budget)
        return jsonify(options), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
```

---

## 4. Backend Real Travel Service (`backend/services/realTravelService.js`)

Create `backend/services/realTravelService.js` to call the NLP service for real details:

```javascript
const axios = require('axios');
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:5000';

async function getRealTravelOptions(source, destination, budget = 'medium') {
  try {
    const response = await axios.post(`${NLP_SERVICE_URL}/travel-options`, {
      source,
      destination,
      budget
    }, { timeout: 15000 }); // 15s timeout
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching real travel options: ${error.message}`);
    // Fallback to mock data if API fails
    return null;
  }
}

module.exports = { getRealTravelOptions };
```

---

## 5. Update Backend Server (`backend/server.js`)

Modify your query logic to utilize `realTravelService.js`:

```javascript
const { getRealTravelOptions } = require('./services/realTravelService');
const { getMockTravelOptions } = require('./services/mockTravelService'); 

app.post('/query', async (req, res) => {
    // ... NLP Extraction logic ...
    const source = entities.source;
    const destination = entities.destination;
    const budget = entities.budget || "medium";
    
    // Attempt real API
    let travelData = await getRealTravelOptions(source, destination, budget);
    
    // Fallback
    if (!travelData || (travelData.flightOptions.length === 0 && travelData.trainOptions.length === 0)) {
        console.log("Falling back to MOCK data.");
        travelData = getMockTravelOptions(source, destination, budget);
    }
    
    // ... Save into database ... //
});
```

---

## 6. City Code Reference Tables

### **Airports**
| City       | Sky ID (IATA) | Entity ID |
|------------|---------------|-----------|
| Chennai    | MAA           | 27544045  |
| Madurai    | IXM           | 27539665  |
| Coimbatore | CJB           | 27544055  |
| Bangalore  | BLR           | 27544026  |
| Mumbai     | BOM           | 27544008  |
| Delhi      | DEL           | 27544015  |

### **Train Stations**
| City       | Station Code |
|------------|--------------|
| Chennai    | MAS          |
| Madurai    | MDU          |
| Coimbatore | CBE          |
| Trichy     | TPJ          |
| Bangalore  | SBC          |
| Mumbai     | CSTM         |
| Delhi      | NDLS         |

---

## 7. Complete Data Flow Diagram

```text
User Input (Tamil) "சென்னை இருந்து மதுரை குறைந்த விலையில்"
    ↓
Backend `/query` endpoint
    ↓
NLP Service `/nlp` (extracts entities) -> { source: "சென்னை", destination: "மதுரை" }
    ↓
Translation Service (Tamil → English) -> { source: "Chennai", destination: "Madurai" }
    ↓
NLP Service `/travel-options` (Python API Service)
    ↓
RapidAPI (Sky Scrapper + IRCTC)
    ↓
Real Flight & Train Data returned to Python
    ↓
Backend receives formatted object (with timeout logic)
    ↓
Backend saves to DB and formats response
    ↓
Frontend renders Itinerary/Options in Tamil
```

---

## 8. Installation & Dependencies

Ensure your environment is ready:

**Python (NLP):**
```bash
cd nlp
pip install python-dotenv requests
pip freeze > requirements.txt
```

**Node.js (Backend):**
Axios should already be installed, if not:
```bash
cd backend
npm install axios
```

---

## 9. Testing Instructions

**1. Test Python API Service directly:**
Run the script to verify console output.
```bash
cd nlp
python api_service.py
```

**2. Test Flask Endpoint directly (cURL):**
```bash
curl -X POST http://localhost:5000/travel-options \
-H "Content-Type: application/json" \
-d '{"source":"Chennai","destination":"Madurai","budget":"low"}'
```

**3. Test Frontend Flow:**
Open your UI on port 3000, type 'Chennai to Madurai', and verify real numbers/flight records appear!

---

## 10. Troubleshooting Section

* **API returns empty data / `[]`**: Ensure the destination supports direct routes, or check rate-limits in RapidAPI dashboard.
* **Connection timeout**: RapidAPI can be slow. Ensure your Axios timeout (`15000ms`) is large enough, or use background loading.
* **Invalid Formats**: API response schemas may shift over time. 
* **API Key Issues**: Double check checking you didn't paste `YOUR_NEW_KEY` but rather your actual API key.

---

## 11. Cost Optimization Tips

* **Cache responses**: Use Redis or a simple map in Node.js to cache routes (`Chennai-Madurai`) for 24 hours to avoid repeatedly hitting the API.
* **Mock data**: Switch back to mock data while building UI to save quota.
* **Rate Limits**: Free tiers on RapidAPI map to strict monthly caps. Keep an eye on your RapidAPI Dashboard.

## 12. Important Notes
* Always use a Try/Catch loop around external fetches to prevent backend crashes. 
* Never expose API keys in the frontend context (`NEXT_PUBLIC_` variables) – keep them secured behind node/python logic.
