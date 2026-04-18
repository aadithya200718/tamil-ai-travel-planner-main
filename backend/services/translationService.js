/**
 * translationService.js
 * Normalizes Tamil/English travel entities for database lookups.
 */

const TAMIL_TO_ENGLISH_MAP = {
  'சென்னை': 'Chennai',
  'மதுரை': 'Madurai',
  'கோயம்புத்தூர்': 'Coimbatore',
  'கோவை': 'Coimbatore',
  'திருச்சி': 'Trichy',
  'திருச்சிராப்பள்ளி': 'Trichy',
  'சேலம்': 'Salem',
  'ஊட்டி': 'Ooty',
  'ராமேஸ்வரம்': 'Rameswaram',
  'கன்னியாகுமரி': 'Kanyakumari',
  'தஞ்சாவூர்': 'Thanjavur',
  'வேலூர்': 'Vellore',
  'திருவள்ளூர்': 'Tiruvallur',
  'கும்பகோணம்': 'Kumbakonam',
  'திருப்பூர்': 'Tiruppur',
  'ஈரோடு': 'Erode',
  'திருநெல்வேலி': 'Tirunelveli',
  'தூத்துக்குடி': 'Tuticorin',
  'நாகர்கோவில்': 'Nagercoil',
  'திண்டுக்கல்': 'Dindigul',
  'கடலூர்': 'Cuddalore',
  'புதுச்சேரி': 'Pondicherry',
  'தேனி': 'Theni',
  'பெங்களூரு': 'Bangalore',
  'பெங்களுரு': 'Bangalore',
  'மும்பை': 'Mumbai',
};

const ENGLISH_TO_TAMIL_MAP = {
  chennai: 'சென்னை',
  madurai: 'மதுரை',
  coimbatore: 'கோயம்புத்தூர்',
  kovai: 'கோயம்புத்தூர்',
  trichy: 'திருச்சி',
  tiruchirappalli: 'திருச்சி',
  salem: 'சேலம்',
  ooty: 'ஊட்டி',
  rameswaram: 'ராமேஸ்வரம்',
  kanyakumari: 'கன்னியாகுமரி',
  thanjavur: 'தஞ்சாவூர்',
  tanjore: 'தஞ்சாவூர்',
  vellore: 'வேலூர்',
  tiruvallur: 'திருவள்ளூர்',
  kumbakonam: 'கும்பகோணம்',
  tiruppur: 'திருப்பூர்',
  erode: 'ஈரோடு',
  tirunelveli: 'திருநெல்வேலி',
  tuticorin: 'தூத்துக்குடி',
  thoothukudi: 'தூத்துக்குடி',
  nagercoil: 'நாகர்கோவில்',
  dindigul: 'திண்டுக்கல்',
  cuddalore: 'கடலூர்',
  pondicherry: 'புதுச்சேரி',
  puducherry: 'புதுச்சேரி',
  theni: 'தேனி',
  bangalore: 'பெங்களூரு',
  bengaluru: 'பெங்களூரு',
  mumbai: 'மும்பை',
};

const TAMIL_PLACE_ALIASES = {
  'கோவை': 'கோயம்புத்தூர்',
  'திருச்சிராப்பள்ளி': 'திருச்சி',
};

const BUDGET_TERMS_MAP = {
  'குறைந்த விலை': 'low',
  'குறைந்த': 'low',
  'மலிவான': 'low',
  'கம்மி': 'low',
  'சிக்கனமான': 'low',
  'பட்ஜெட்': 'low',
  'நடுத்தர விலை': 'medium',
  'நடுத்தர': 'medium',
  'சராசரி': 'medium',
  'அதிக விலை': 'high',
  'விலை உயர்ந்த': 'high',
  'லக்சரி': 'high',
  'ஆடம்பரமான': 'high',
};

function translateToEnglish(placeText) {
  if (!placeText) return '';

  const normalized = String(placeText).trim();
  if (!normalized) return '';

  if (TAMIL_TO_ENGLISH_MAP[normalized]) {
    return TAMIL_TO_ENGLISH_MAP[normalized];
  }

  const lowered = normalized.toLowerCase();
  return Object.values(TAMIL_TO_ENGLISH_MAP).find(value => value.toLowerCase() === lowered) || normalized;
}

function translatePlaceToTamil(placeText) {
  if (!placeText) return '';

  const normalized = String(placeText).trim();
  if (!normalized) return '';

  if (TAMIL_PLACE_ALIASES[normalized]) {
    return TAMIL_PLACE_ALIASES[normalized];
  }

  if (TAMIL_TO_ENGLISH_MAP[normalized]) {
    return normalized;
  }

  return ENGLISH_TO_TAMIL_MAP[normalized.toLowerCase()] || normalized;
}

function translateBudget(budgetText) {
  if (!budgetText) return '';

  const normalized = String(budgetText).trim().toLowerCase();
  if (!normalized) return '';

  for (const [tamil, english] of Object.entries(BUDGET_TERMS_MAP)) {
    if (normalized.includes(tamil.toLowerCase())) {
      return english;
    }
  }

  if (['low', 'medium', 'high'].includes(normalized)) {
    return normalized;
  }

  const priceMatch = String(budgetText).match(/[₹]?\s*(\d+(?:,\d{3})*)/);
  if (priceMatch) {
    return String(budgetText);
  }

  return String(budgetText);
}

function translateEntities(entities) {
  if (!entities) return entities;

  return {
    ...entities,
    source: entities.source ? translateToEnglish(entities.source) : '',
    destination: entities.destination ? translateToEnglish(entities.destination) : '',
    budget: entities.budget ? translateBudget(entities.budget) : '',
  };
}

function translateEntitiesToTamil(entities) {
  if (!entities) return entities;

  return {
    ...entities,
    source: entities.source ? translatePlaceToTamil(entities.source) : '',
    destination: entities.destination ? translatePlaceToTamil(entities.destination) : '',
    budget: entities.budget ? translateBudget(entities.budget) : '',
  };
}

module.exports = {
  translateToEnglish,
  translatePlaceToTamil,
  translateBudget,
  translateEntities,
  translateEntitiesToTamil,
  TAMIL_TO_ENGLISH_MAP,
};
