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
