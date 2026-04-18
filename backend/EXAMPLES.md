# Translation Examples - Real User Queries

## Example 1: Basic Travel Query with Budget
**User Input (Tamil):**
```
சென்னை இருந்து மதுரை குறைந்த விலையில் செல்ல வேண்டும்
```

**Translation Flow:**
```javascript
// NLP extracts
{
  source: "சென்னை",
  destination: "மதுரை",
  budget: "குறைந்த விலை"
}

// After translation
{
  source: "Chennai",
  destination: "Madurai",
  budget: "low"
}

// Database query
getTravelOptions("Chennai", "Madurai", "low")
// Returns only budget-friendly options (trains, state buses)
```

**Result:**
- Shows only low-cost travel options
- Filters out expensive flights
- Displays in Tamil

---

## Example 2: Mixed Language with Price
**User Input (Mixed):**
```
Chennai to கோவை 500 ரூபாய்க்குள்
```

**Translation Flow:**
```javascript
// NLP extracts
{
  source: "Chennai",
  destination: "கோவை",
  budget: "500 ரூபாய்"
}

// After translation
{
  source: "Chennai",
  destination: "Coimbatore",
  budget: "500 ரூபாய்"
}

// Database query
getTravelOptions("Chennai", "Coimbatore", "500 ரூபாய்")
// Filters options under ₹500
```

**Result:**
- Shows TNSTC buses (₹200-₹250)
- Hides expensive trains and flights
- Price preserved for filtering

---

## Example 3: Luxury Travel
**User Input (Tamil):**
```
மதுரை லிருந்து ராமேஸ்வரம் லக்ஷரி பயணம்
```

**Translation Flow:**
```javascript
// NLP extracts
{
  source: "மதுரை",
  destination: "ராமேஸ்வரம்",
  budget: "லக்ஷரி"
}

// After translation
{
  source: "Madurai",
  destination: "Rameswaram",
  budget: "high"
}

// Database query
getTravelOptions("Madurai", "Rameswaram", "high")
// Returns premium options
```

**Result:**
- Shows AC buses, premium trains
- Includes flight options if available
- Displays in Tamil

---

## Example 4: Search Endpoint
**API Request:**
```bash
curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -d '{"query": "சென்னை"}'
```

**Response:**
```json
{
  "originalQuery": "சென்னை",
  "translatedQuery": "Chennai",
  "message": "தேடல்: \"சென்னை\" → \"Chennai\""
}
```

---

## Example 5: Complete Voice Query
**User speaks:**
```
நாளை சென்னை இருந்து தேனி மலிவான பயணம் வேண்டும்
```

**Processing:**
```javascript
// 1. Whisper transcribes audio → text
"நாளை சென்னை இருந்து தேனி மலிவான பயணம் வேண்டும்"

// 2. NLP extracts entities
{
  source: "சென்னை",
  destination: "தேனி",
  date: "நாளை",
  budget: "மலிவான"
}

// 3. Translation service
{
  source: "Chennai",
  destination: "Theni",
  date: "நாளை",
  budget: "low"
}

// 4. Database query
getTravelOptions("Chennai", "Theni", "low")

// 5. Generate Tamil itinerary
"✈️ உங்கள் பயண திட்டம்
📍 புறப்படும் இடம்: Chennai
🏁 சேரும் இடம்: Theni
📅 தேதி: நாளை
💵 பட்ஜெட்: low

🚌 பயண வசதிகள்:
  • ரயில்: Theni Express - ₹420 (10h 30m)
  • பேருந்து: SETC Ultra Deluxe - ₹550 (10h 00m)"
```

---

## Budget Term Variations

All these Tamil terms map to "low":
- குறைந்த விலை
- மலிவான
- கம்மி
- பட்ஜெட்
- சிக்கனமான

All these map to "medium":
- நடுத்தர விலை
- நடுத்தர
- சராசரி

All these map to "high":
- அதிக விலை
- விலை உயர்ந்த
- லக்ஷரி
- ஆடம்பரமான

---

## Testing

Run the test script to see all translations:
```bash
node backend/test-translation.js
```

Expected output:
```
=== Translation Service Test ===

Individual Place Translation:
  சென்னை → Chennai
  மதுரை → Madurai
  கோயம்புத்தூர் → Coimbatore
  ...

Budget/Price Translation:
  குறைந்த விலை → low
  மலிவான → low
  லக்ஷரி → high
  ₹500 → ₹500
  ...

Entity Translation (with Budget):
  Test 1:
    Original: சென்னை → மதுரை (குறைந்த விலை)
    Translated: Chennai → Madurai (low)
  ...
```
