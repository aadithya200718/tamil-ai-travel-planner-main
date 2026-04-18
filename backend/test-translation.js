/**
 * Test script for translation service
 * Run: node backend/test-translation.js
 */

const { translateToEnglish, translateBudget, translateEntities } = require('./services/translationService');

console.log('=== Translation Service Test ===\n');

// Test individual place names
const testPlaces = [
  'சென்னை',
  'மதுரை',
  'கோயம்புத்தூர்',
  'Chennai',
  'Madurai',
  'தேனி',
];

console.log('Individual Place Translation:');
testPlaces.forEach(place => {
  const translated = translateToEnglish(place);
  console.log(`  ${place} → ${translated}`);
});

console.log('\n');

// Test budget/price translation
const testBudgets = [
  'குறைந்த விலை',
  'மலிவான',
  'பட்ஜெட்',
  'நடுத்தர விலை',
  'அதிக விலை',
  'லக்ஷரி',
  '₹500',
  '1000 ரூபாய்',
  'low',
  'medium',
];

console.log('Budget/Price Translation:');
testBudgets.forEach(budget => {
  const translated = translateBudget(budget);
  console.log(`  ${budget} → ${translated}`);
});

console.log('\n');

// Test entity translation with budget
const testEntities = [
  { source: 'சென்னை', destination: 'மதுரை', date: 'tomorrow', budget: 'குறைந்த விலை' },
  { source: 'Chennai', destination: 'Coimbatore', date: '2024-12-25', budget: 'medium' },
  { source: 'கோவை', destination: 'ஊட்டி', date: '', budget: 'மலிவான' },
  { source: 'சென்னை', destination: 'தேனி', date: 'next week', budget: '₹500' },
  { source: 'மதுரை', destination: 'ராமேஸ்வரம்', date: '', budget: 'லக்ஷரி' },
];

console.log('Entity Translation (with Budget):');
testEntities.forEach((entities, idx) => {
  const translated = translateEntities(entities);
  console.log(`  Test ${idx + 1}:`);
  console.log(`    Original: ${entities.source} → ${entities.destination} (${entities.budget})`);
  console.log(`    Translated: ${translated.source} → ${translated.destination} (${translated.budget})`);
});

console.log('\n');

// Test real-world queries
const realWorldQueries = [
  { 
    query: 'சென்னை இருந்து மதுரை குறைந்த விலையில் செல்ல வேண்டும்',
    entities: { source: 'சென்னை', destination: 'மதுரை', budget: 'குறைந்த விலை' }
  },
  { 
    query: 'கோவை லிருந்து ஊட்டி பட்ஜெட் பயணம்',
    entities: { source: 'கோவை', destination: 'ஊட்டி', budget: 'பட்ஜெட்' }
  },
  { 
    query: 'Chennai to Bangalore luxury travel',
    entities: { source: 'Chennai', destination: 'Bangalore', budget: 'luxury' }
  },
];

console.log('Real-World Query Examples:');
realWorldQueries.forEach((example, idx) => {
  const translated = translateEntities(example.entities);
  console.log(`  Example ${idx + 1}:`);
  console.log(`    Query: "${example.query}"`);
  console.log(`    Translated: ${translated.source} → ${translated.destination} (Budget: ${translated.budget})`);
});

console.log('\n=== Test Complete ===');
