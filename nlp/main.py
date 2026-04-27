"""
main.py — NLP logic for Tamil AI Travel Planner.
Provides keyword-based intent detection and positional entity extraction.
"""

import re
import unicodedata

# ─── Intent keywords ──────────────────────────────────────────────────────────

INTENT_KEYWORDS = {
    "plan_trip": [
        "திட்டமிடு", "பயணம்", "travel", "trip", "plan",
        "செல்ல", "போக", "வர", "பயண திட்டம்",
    ],
    "get_routes": [
        "வழி", "route", "path", "எப்படி போவது", "எந்த வழி",
        "ரூட்", "வழிகள்",
    ],
    "get_budget_trip": [
        "பட்ஜெட்", "budget", "குறைந்த விலை", "cheap", "affordable",
        "சேமிப்பு", "கம்மி", "மலிவான",
    ],
    "get_places": [
        "இடங்கள்", "places", "tourist", "சுற்றுலா இடங்கள்", "பார்க்க",
        "attractions", "sight", "மணிமண்டபம்", "கோவில்",
    ],
    "find_hotel": [
        "hotel", "hotels", "விடுதி", "ஹோட்டல்", "தங்கும்", "தங்க",
        "lodge", "stay", "room", "accommodation", "resort", "ரிசார்ட்",
        "ஹோம்ஸ்டே", "homestay", "தங்கும் விடுதி",
    ],
}

# ─── Entity extraction ────────────────────────────────────────────────────────

# Known Tamil Nadu cities / places for entity tagging
TAMIL_PLACES = [
    "Chennai", "சென்னை",
    "Madurai", "மதுரை",
    "Coimbatore", "கோயம்புத்தூர்", "கோவை",
    "Trichy", "திருச்சி", "திருச்சிராப்பள்ளி",
    "Salem", "சேலம்",
    "Ooty", "ஊட்டி",
    "Rameswaram", "ராமேஸ்வரம்",
    "Kanyakumari", "கன்னியாகுமரி",
    "Tanjore", "Thanjavur", "தஞ்சாவூர்",
    "Vellore", "வேலூர்",
    "Tiruvallur", "திருவள்ளூர்",
    "Kumbakonam", "கும்பகோணம்",
    "Tiruppur", "திருப்பூர்",
    "Erode", "ஈரோடு",
    "Tirunelveli", "திருநெல்வேலி",
    "Tuticorin", "தூத்துக்குடி",
    "Nagercoil", "நாகர்கோவில்",
    "Dindigul", "திண்டுக்கல்",
    "Cuddalore", "கடலூர்",
    "Pondicherry", "Puducherry", "புதுச்சேரி",
    # South India - new
    "Tirupati", "திருப்பதி",
    "Tiruvannamalai", "திருவண்ணாமலை",
    "Kanchipuram", "காஞ்சிபுரம்",
    "Namakkal", "நாமக்கல்",
    "Karur", "கரூர்",
    "Theni", "தேனி",
    "Virudhunagar", "விருதுநகர்",
    "Sivagangai", "சிவகங்கை",
    "Pudukkottai", "புதுக்கோட்டை",
    "Perambalur", "பெரம்பலூர்",
    "Dharmapuri", "தர்மபுரி",
    # North India
    "Bangalore", "Bengaluru", "பெங்களூர்",
    "Hyderabad", "ஹைதராபாத்",
    "Vizag", "Visakhapatnam", "விசாகப்பட்டினம்",
    "Vijayawada", "விஜயவாடா",
    "Mysore", "Mysuru", "மைசூர்",
    "Goa", "கோவா",
    "Mumbai", "மும்பை",
    "Pune", "புனே",
    "Kochi", "Cochin", "கொச்சி",
    "Thiruvananthapuram", "Trivandrum", "திருவனந்தபுரம்",
    "Mangalore", "Mangaluru", "மங்களூர்",
    "Delhi", "டெல்லி",
    "Kolkata", "கொல்கத்தா",
]

PLACE_ALIASES = {
    "கோயம்புத்தூரு": "கோயம்புத்தூர்",
    "தஞ்சாவூரு": "தஞ்சாவூர்",
    "திருச்சியி": "திருச்சி",
    "சேலத்து": "சேலம்",
    "கும்பகோணத்து": "கும்பகோணம்",
}

# Regex patterns for source city
# Tamil word order: "CITY இருந்து" — city comes BEFORE the postposition
# English word order: "from CITY" — city comes AFTER the preposition
_SOURCE_MARKERS_TAMIL = ["இருந்து", "லிருந்து", "நகரிலிருந்து"]
_SOURCE_MARKERS_NORM = [unicodedata.normalize("NFC", m) for m in _SOURCE_MARKERS_TAMIL]

# Regex patterns for destination city
# Tamil word order: "CITY க்கு" — city comes BEFORE the postposition
# English word order: "to CITY" — city comes AFTER the preposition
_DEST_MARKERS_TAMIL = ["க்கு", "செல்ல", "போக", "வரை"]
_DEST_MARKERS_NORM = [unicodedata.normalize("NFC", m) for m in _DEST_MARKERS_TAMIL]

# Date patterns
DATE_PATTERNS = [
    r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",
    r"\b(\d{4}-\d{2}-\d{2})\b",
    r"\b(January|February|March|April|May|June|July|August|September|October|November|December"
    r"|ஜனவரி|பிப்ரவரி|மார்ச்|ஏப்ரல்|மே|ஜூன்|ஜூலை|ஆகஸ்ட்|செப்டம்பர்|அக்டோபர்|நவம்பர்|டிசம்பர்)"
    r"\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?\b",
    r"\b(tomorrow|today|next week|next month)\b",
]

# Budget patterns
BUDGET_PATTERNS = [
    r"\b(budget|குறைந்த|cheap|affordable|மலிவான|கம்மி)\b",
    r"(?:rs\.?|₹|inr)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)",
    r"\b(\d+(?:,\d{3})*)\s*(?:rs|rupees|ரூபாய்|ரூ)",
]


def detect_intent(text: str) -> str:
    """
    Returns the best-matching intent for the given text.
    Falls back to 'plan_trip' if nothing matches.
    """
    text_lower = text.lower()
    scores = {intent: 0 for intent in INTENT_KEYWORDS}
    for intent, keywords in INTENT_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                scores[intent] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "plan_trip"


def _normalize(text: str) -> str:
    """Normalize Unicode text to NFC form for consistent Tamil string matching."""
    return unicodedata.normalize("NFC", text)


def _find_place_in_text(text: str, patterns: list[str]) -> str:
    """
    Tries each pattern; returns the captured group only if it is a known place.
    Falls back to the first captured group if no known-place match is found.
    """
    first_match = ""
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            if any(candidate.lower() == p.lower() for p in TAMIL_PLACES):
                return candidate
            if not first_match:
                first_match = candidate
    return ""  # Don't use non-place fallback; rely on _find_known_places instead


def _find_known_places_with_idx(text: str) -> list[tuple[int, str]]:
    """Returns all known Tamil places found in the text with index, ordered by position."""
    text_norm = _normalize(text.lower())
    matches = []
    seen: set[str] = set()
    for place in TAMIL_PLACES:
        place_norm = _normalize(place.lower())
        idx = text_norm.find(place_norm)
        if idx != -1 and place not in seen:
            matches.append((idx, place))
            seen.add(place)
            
    for alias, canonical in PLACE_ALIASES.items():
        alias_norm = _normalize(alias.lower())
        idx = text_norm.find(alias_norm)
        if idx != -1 and canonical not in seen:
            matches.append((idx, canonical))
            seen.add(canonical)

    matches.sort(key=lambda x: x[0])
    return matches

def _find_known_places(text: str) -> list[str]:
    """Returns all known Tamil places found in the text, ordered by position in text."""
    matches = _find_known_places_with_idx(text)
    return [place for _, place in matches]


def _find_source_by_marker(text: str, known_with_idx: list[tuple[int, str]]) -> str:
    """
    Find source city using positional markers.
    Tamil pattern: "CITY இருந்து" — the known place that appears just before a
    source marker is the source city.
    English pattern: "from CITY".
    """
    text_norm = _normalize(text)
    for marker_norm in _SOURCE_MARKERS_NORM:
        idx = text_norm.find(marker_norm)
        if idx != -1:
            best_place = ""
            best_p_idx = -1
            for p_idx, place in known_with_idx:
                if best_p_idx < p_idx < idx:
                    best_p_idx = p_idx
                    best_place = place
            if best_place:
                return best_place
                
    # English "from CITY"
    known_places = [p for _, p in known_with_idx]
    places_norm = [_normalize(p) for p in known_places]
    m = re.search(r"(?:from)\s+(\S+)", text, re.IGNORECASE)
    if m:
        candidate = _normalize(m.group(1).strip().lower())
        for place, place_norm in zip(known_places, places_norm):
            if _normalize(place.lower()) == candidate:
                return place
    return ""


def _find_dest_by_marker(text: str, known_with_idx: list[tuple[int, str]]) -> str:
    """
    Find destination city using positional markers.
    Tamil pattern: "CITY செல்ல / CITY க்கு" — the known place that appears just
    before a destination marker is the destination city.
    English pattern: "to CITY" / "towards CITY".
    """
    text_norm = _normalize(text)
    for marker_norm in _DEST_MARKERS_NORM:
        idx = text_norm.find(marker_norm)
        if idx != -1:
            best_place = ""
            best_p_idx = -1
            for p_idx, place in known_with_idx:
                if best_p_idx < p_idx < idx:
                    best_p_idx = p_idx
                    best_place = place
            if best_place:
                return best_place
                
    # English "to CITY" or "towards CITY"
    known_places = [p for _, p in known_with_idx]
    places_norm = [_normalize(p) for p in known_places]
    m = re.search(r"(?:to|towards)\s+(\S+)", text, re.IGNORECASE)
    if m:
        candidate = _normalize(m.group(1).strip().lower())
        for place, place_norm in zip(known_places, places_norm):
            if _normalize(place.lower()) == candidate:
                return place
    return ""


def extract_entities(text: str) -> dict:
    """
    Extracts source, destination, date, and budget from text.
    Uses positional marker logic for Tamil and English postpositions/prepositions,
    with a positional fallback when no markers are present.
    """
    known_with_idx = _find_known_places_with_idx(text)
    known = [p for _, p in known_with_idx]

    source = _find_source_by_marker(text, known_with_idx)
    destination = _find_dest_by_marker(text, known_with_idx)

    # Fallback: positional assignment when markers didn't resolve both places
    if not source and not destination:
        if len(known) >= 2:
            source = known[0]
            destination = known[1]
        elif len(known) == 1:
            destination = known[0]
    elif not source:
        for place in known:
            if place != destination:
                source = place
                break
    elif not destination:
        for place in known:
            if place != source:
                destination = place
                break

    # Date
    date = ""
    for pattern in DATE_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            date = m.group(0).strip()
            break

    # Budget
    budget = ""
    for pattern in BUDGET_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            budget = m.group(0).strip()
            break

    return {
        "source": source,
        "destination": destination,
        "date": date,
        "budget": budget,
    }


def process_text(text: str) -> dict:
    """
    Main entry: returns intent + entities for the given text.
    """
    intent = detect_intent(text)
    entities = extract_entities(text)
    return {"intent": intent, "entities": entities}
