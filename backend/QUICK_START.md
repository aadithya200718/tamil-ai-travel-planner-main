# Quick Start - Tamil Price Search

## What's New?
Users can now search with Tamil place names AND budget/price terms!

## Examples That Now Work

✅ **சென்னை இருந்து மதுரை குறைந்த விலையில்**
   - Translates: Chennai → Madurai (low budget)

✅ **கோவை லிருந்து ஊட்டி மலிவான பயணம்**
   - Translates: Coimbatore → Ooty (low budget)

✅ **Chennai to தேனி 500 ரூபாய்க்குள்**
   - Translates: Chennai → Theni (₹500 budget)

✅ **மதுரை லிருந்து ராமேஸ்வரம் லக்ஷரி**
   - Translates: Madurai → Rameswaram (high budget)

## How to Test

### 1. Run Translation Test
```bash
node backend/test-translation.js
```

### 2. Test via API
```bash
# Start backend
cd backend
npm start

# Test search endpoint
curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -d '{"query": "சென்னை"}'

# Test query with budget
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{"text": "சென்னை இருந்து மதுரை குறைந்த விலையில்"}'
```

### 3. Test via Frontend
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Go to planner page
4. Type or speak: "சென்னை இருந்து மதுரை குறைந்த விலையில்"
5. See filtered results!

## Budget Terms Supported

| Tamil | English | Effect |
|-------|---------|--------|
| குறைந்த விலை | low | Shows buses, cheap trains |
| மலிவான | low | Shows buses, cheap trains |
| பட்ஜெட் | low | Shows buses, cheap trains |
| நடுத்தர விலை | medium | Shows AC buses, good trains |
| லக்ஷரி | high | Shows flights, premium options |
| ₹500 | ₹500 | Filters by exact price |

## Files Modified

1. **backend/services/translationService.js** (NEW)
   - Place name translation
   - Budget term translation
   - Entity translation

2. **backend/server.js** (UPDATED)
   - Added translation import
   - Updated processQuery to translate entities
   - Added /search endpoint

3. **backend/services/itineraryService.js** (UPDATED)
   - Added translation import
   - Translates entities before use

## What Happens Behind the Scenes

```
User Input (Tamil) 
    ↓
NLP Service (extracts entities)
    ↓
Translation Service (Tamil → English)
    ↓
Database Query (English)
    ↓
Results (displayed in Tamil)
```

## Need Help?

- See `TRANSLATION_GUIDE.md` for detailed documentation
- See `EXAMPLES.md` for real-world examples
- Run `node backend/test-translation.js` to test translations

## Adding More Terms

Edit `backend/services/translationService.js`:

```javascript
// Add new place
const TAMIL_TO_ENGLISH_MAP = {
  'புதிய_நகரம்': 'New City',
  // ...
};

// Add new budget term
const BUDGET_TERMS_MAP = {
  'புதிய_வார்த்தை': 'low',
  // ...
};
```

That's it! 🎉
