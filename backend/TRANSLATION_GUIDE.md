# Tamil to English Translation Guide

## Problem
Users search in Tamil (சென்னை, மதுரை, etc.) but the database stores place names in English (Chennai, Madurai, etc.).

## Solution
Created a translation service that automatically converts Tamil place names to English before querying the database.

## How It Works

### 1. Translation Service (`services/translationService.js`)
- Maps Tamil place names to English equivalents
- Translates Tamil budget/price terms (குறைந்த விலை → low, மலிவான → low, etc.)
- Supports major Tamil Nadu cities and tourist destinations
- Handles both Tamil and English input gracefully
- Preserves numeric prices (₹500, 1000 ரூபாய்)

### 2. Integration Points

#### Server (`server.js`)
```javascript
// Import translation service
const { translateEntities } = require('./services/translationService');

// In processQuery function
const translatedEntities = translateEntities(entities);
const travelOptions = getTravelOptions(
  translatedEntities.source,
  translatedEntities.destination,
  translatedEntities.budget
);
```

#### Itinerary Service (`services/itineraryService.js`)
```javascript
const { translateEntities } = require('./translationService');

function generateItinerary(nlpResult, travelOptions) {
  const translatedEntities = translateEntities(entities);
  // Use translatedEntities for database queries
}
```

### 3. New Search Endpoint
```
POST /search
Body: { "query": "சென்னை" }
Response: { 
  "originalQuery": "சென்னை",
  "translatedQuery": "Chennai",
  "message": "தேடல்: \"சென்னை\" → \"Chennai\""
}
```

## Testing

Run the test script:
```bash
node backend/test-translation.js
```

## Supported Places

Tamil Nadu cities:
- சென்னை → Chennai
- மதுரை → Madurai
- கோயம்புத்தூர் / கோவை → Coimbatore
- திருச்சி → Trichy
- ஊட்டி → Ooty
- தேனி → Theni
- And many more...

## Supported Budget Terms

Low budget:
- குறைந்த விலை → low
- மலிவான → low
- கம்மி → low
- பட்ஜெட் → low
- சிக்கனமான → low

Medium budget:
- நடுத்தர விலை → medium
- நடுத்தர → medium
- சராசரி → medium

High budget:
- அதிக விலை → high
- விலை உயர்ந்த → high
- லக்ஷரி → high
- ஆடம்பரமான → high

Numeric prices are preserved as-is:
- ₹500 → ₹500
- 1000 ரூபாய் → 1000 ரூபாய்

## Adding New Places

Edit `backend/services/translationService.js`:

```javascript
const TAMIL_TO_ENGLISH_MAP = {
  'புதிய_இடம்': 'New Place',
  // Add more mappings here
};
```

## Usage Examples

### Voice/Text Query with Budget
User says: "சென்னை இருந்து மதுரை குறைந்த விலையில் செல்ல வேண்டும்"
1. NLP extracts: { source: "சென்னை", destination: "மதுரை", budget: "குறைந்த விலை" }
2. Translation converts: { source: "Chennai", destination: "Madurai", budget: "low" }
3. Database query uses English names and budget category
4. Results filtered by budget and displayed in Tamil

### Voice/Text Query with Price
User says: "கோவை லிருந்து ஊட்டி 500 ரூபாய்க்குள்"
1. NLP extracts: { source: "கோவை", destination: "ஊட்டி", budget: "500 ரூபாய்" }
2. Translation converts: { source: "Coimbatore", destination: "Ooty", budget: "500 ரூபாய்" }
3. Database query filters by price range
4. Results displayed in Tamil

### Search
User types: "கோவை"
1. Frontend sends: { query: "கோவை" }
2. Backend translates: "Coimbatore"
3. Database searches for "Coimbatore"
4. Results returned

## Benefits
- Users can search in Tamil naturally
- Database remains in English (standard format)
- No database migration needed
- Easy to add new place mappings
- Works with both Tamil and English input
