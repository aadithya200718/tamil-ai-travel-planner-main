const { translateEntitiesToTamil } = require('./translationService');

const MODE_LABELS = {
  all: 'பேருந்து மற்றும் ரயில்',
  bus: 'பேருந்து',
  train: 'ரயில்',
  flight: 'விமானம்',
  hotel: 'தங்கும் விடுதி',
};

const PLACE_ALIASES = {
  'கோவை': 'கோயம்புத்தூர்',
  'திருச்சிராப்பள்ளி': 'திருச்சி',
};

function normalizeTravelMode(mode) {
  const normalized = String(mode || '').trim().toLowerCase();
  if (['bus', 'train', 'flight', 'hotel'].includes(normalized)) {
    return normalized;
  }

  return 'all';
}

function normalizePlace(value) {
  const translated = translateEntitiesToTamil({ source: value }).source || '';
  return PLACE_ALIASES[translated] || translated;
}

function getBudgetCap(budget) {
  const normalized = String(budget || '').trim().toLowerCase();
  if (!normalized) return null;

  const digits = normalized.match(/\d+/g);
  if (digits && digits.length > 0) {
    return Number.parseInt(digits.join(''), 10);
  }

  if (normalized === 'low') return 500;
  if (normalized === 'medium') return 900;
  return null;
}

function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} நிமிடம்`;
  if (minutes === 0) return `${hours} மணி`;
  return `${hours} மணி ${minutes} நிமிடம்`;
}

function estimateDuration(distanceKm, serviceType, mode) {
  const label = String(serviceType || '').toLowerCase();
  let speed = mode === 'train' ? 55 : 45;

  if (mode === 'bus') {
    if (label.includes('ஏசி') || label.includes('ac')) speed = 55;
    if (label.includes('ஸ்லீப்பர்')) speed = 50;
    if (label.includes('எக்ஸ்பிரஸ்')) speed = 52;
  } else {
    if (label.includes('சூப்பர்') || label.includes('superfast')) speed = 65;
    if (label.includes('எக்ஸ்பிரஸ்') || label.includes('express')) speed = 58;
    if (label.includes('பேஸஞ்சர்') || label.includes('passenger')) speed = 40;
  }

  const totalMinutes = Math.max(30, Math.round((distanceKm / speed) * 12) * 5);
  return formatDuration(totalMinutes);
}

function mapBusRow(row) {
  return {
    id: row.id,
    mode: 'bus',
    source: row.source,
    destination: row.destination,
    serviceType: row.bus_type,
    trainNumber: '',
    distanceKm: row.distance_km,
    price: row.price_inr,
    duration: estimateDuration(row.distance_km, row.bus_type, 'bus'),
    name: `${row.bus_type} பேருந்து`,
    type: 'bus',
  };
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const unique = [];

  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}

function routeDedupeKey(route) {
  return [
    route.mode,
    route.source,
    route.destination,
    route.serviceType,
    route.trainNumber || '',
    route.distanceKm,
    route.price,
  ].join('|');
}

function mapTrainRow(row) {
  return {
    id: row.id,
    mode: 'train',
    source: row.source,
    destination: row.destination,
    serviceType: row.train_type,
    trainNumber: row.train_number,
    distanceKm: row.distance_km,
    price: row.price_inr,
    duration: estimateDuration(row.distance_km, row.train_type, 'train'),
    name: `${row.train_type} ${row.train_number}`,
    type: 'train',
  };
}

async function executeRouteQuery(supabase, tableName, filters, limit) {
  let query = supabase
    .from(tableName)
    .select('*')
    .order('price_inr', { ascending: true })
    .order('distance_km', { ascending: true })
    .limit(limit);

  if (filters.source && filters.destination) {
    query = query.eq('source', filters.source).eq('destination', filters.destination);
  } else if (filters.source) {
    query = query.or(`source.eq.${filters.source},destination.eq.${filters.source}`);
  } else if (filters.destination) {
    query = query.or(`source.eq.${filters.destination},destination.eq.${filters.destination}`);
  }

  if (filters.budgetCap) {
    query = query.lte('price_inr', filters.budgetCap);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

async function queryRoutes(mode, filters) {
  const supabase = require('../db').supabase;
  const tableName = mode === 'bus' ? 'bus_routes' : 'train_routes';
  const mapper = mode === 'bus' ? mapBusRow : mapTrainRow;
  const limit = filters.source && filters.destination ? 12 : 20;

  const { data, error } = await executeRouteQuery(supabase, tableName, filters, limit);
  if (error) {
    console.error(`Route query error (${tableName}):`, error.message);
    return [];
  }

  if (data.length > 0 || !filters.source || !filters.destination) {
    return uniqueBy(data.map(mapper), routeDedupeKey);
  }

  const reverseFilters = {
    ...filters,
    source: filters.destination,
    destination: filters.source,
  };
  const reverseResult = await executeRouteQuery(supabase, tableName, reverseFilters, limit);

  if (reverseResult.error) {
    console.error(`Reverse route query error (${tableName}):`, reverseResult.error.message);
    return [];
  }

  return uniqueBy(
    reverseResult.data.map(row => ({
      ...mapper(row),
      source: filters.source,
      destination: filters.destination,
    })),
    routeDedupeKey
  );
}

function mapHotelRow(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    hotelType: row.hotel_type,
    starRating: row.star_rating,
    pricePerNight: row.price_per_night,
    amenities: row.amenities,
    description: row.description,
    rating: row.rating,
    totalReviews: row.total_reviews,
  };
}

async function queryHotels(city) {
  const supabase = require('../db').supabase;

  let query = supabase
    .from('hotels')
    .select('*')
    .order('rating', { ascending: false })
    .order('price_per_night', { ascending: true })
    .limit(20);

  if (city) {
    query = query.eq('city', city);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Hotel query error:', error.message);
    return [];
  }

  return (data || []).map(mapHotelRow);
}

function buildTravelOptions(source, destination, busRoutes, trainRoutes) {
  return {
    source,
    destination,
    options: {
      bus: busRoutes.map(route => ({
        type: 'bus',
        name: route.name,
        price: route.price,
        duration: route.duration,
        source: route.source,
        destination: route.destination,
      })),
      train: trainRoutes.map(route => ({
        type: 'train',
        name: route.name,
        price: route.price,
        duration: route.duration,
        source: route.source,
        destination: route.destination,
      })),
      flight: [],
    },
  };
}

function buildItinerary({ source, destination, requestedMode, budgetCap, busRoutes, trainRoutes }) {
  const lines = ['பயண தரவுத்தள தேடல் முடிவு', ''];

  if (source) lines.push(`புறப்படும் இடம்: ${source}`);
  if (destination) lines.push(`செல்லும் இடம்: ${destination}`);
  lines.push(`தேடல் வகை: ${MODE_LABELS[requestedMode] || MODE_LABELS.all}`);
  if (budgetCap) lines.push(`அதிகபட்ச கட்டணம்: ரூ.${budgetCap}`);
  lines.push('');

  if (!source && !destination) {
    lines.push('தயவுசெய்து புறப்படும் இடமும் செல்லும் இடமும் சொல்லுங்கள்.');
    return lines.join('\n');
  }

  const totalMatches = busRoutes.length + trainRoutes.length;
  if (totalMatches === 0) {
    lines.push('பொருந்தும் வழிகள் எதுவும் கிடைக்கவில்லை.');
    lines.push('நகர பெயர்களை மாற்றி மீண்டும் முயற்சிக்கவும்.');
    return lines.join('\n');
  }

  lines.push(`மொத்த பொருத்தங்கள்: ${totalMatches}`);
  lines.push('');

  if (busRoutes.length > 0) {
    lines.push(`பேருந்து வழிகள் (${busRoutes.length})`);
    busRoutes.slice(0, 5).forEach((route, index) => {
      lines.push(
        `${index + 1}. ${route.source} -> ${route.destination} | ${route.serviceType} | ${route.distanceKm} கிமீ | ரூ.${route.price}`
      );
    });
    lines.push('');
  }

  if (trainRoutes.length > 0) {
    lines.push(`ரயில் வழிகள் (${trainRoutes.length})`);
    trainRoutes.slice(0, 5).forEach((route, index) => {
      lines.push(
        `${index + 1}. ${route.source} -> ${route.destination} | ${route.serviceType} | எண் ${route.trainNumber} | ${route.distanceKm} கிமீ | ரூ.${route.price}`
      );
    });
  }

  return lines.join('\n');
}

async function findRelevantRoutes({ mode, entities }) {
  const requestedMode = normalizeTravelMode(mode);
  const normalizedEntities = translateEntitiesToTamil(entities || {});
  const source = normalizePlace(normalizedEntities.source);
  const destination = normalizePlace(normalizedEntities.destination);
  const budgetCap = getBudgetCap(normalizedEntities.budget);

  // Same-city validation
  if (source && destination && source === destination) {
    return {
      shouldUseDatabase: true,
      requestedMode,
      error: true,
      errorMessage: `"${source}" இருந்து "${destination}" க்கு பயணம் தேட முடியாது. புறப்படும் இடமும் சேரும் இடமும் வேறுபட்டதாக இருக்க வேண்டும்.`,
      entities: { ...normalizedEntities, source, destination },
      routeResults: { requestedMode, totalMatches: 0, bus: [], train: [], hotels: [] },
      itinerary: `பிழை: புறப்படும் இடமும் சேரும் இடமும் ஒன்றாக இருக்கிறது (${source}). வேறு நகரங்களை கொடுக்கவும்.`,
      travelOptions: { source, destination, options: { bus: [], train: [], flight: [] } },
    };
  }

  // Hotel search mode
  if (requestedMode === 'hotel') {
    const hotelCity = destination || source || '';
    const hotels = await queryHotels(hotelCity);

    const hotelLines = ['தங்கும் விடுதி தேடல் முடிவு', ''];
    if (hotelCity) hotelLines.push(`நகரம்: ${hotelCity}`);
    hotelLines.push(`மொத்த விடுதிகள்: ${hotels.length}`);
    hotelLines.push('');
    hotels.slice(0, 10).forEach((h, i) => {
      hotelLines.push(`${i + 1}. ${h.name} | ${h.starRating}⭐ | ரூ.${h.pricePerNight}/இரவு | ${h.hotelType}`);
    });

    return {
      shouldUseDatabase: true,
      requestedMode: 'hotel',
      entities: { ...normalizedEntities, source, destination },
      routeResults: {
        requestedMode: 'hotel',
        totalMatches: hotels.length,
        bus: [],
        train: [],
        hotels,
      },
      itinerary: hotelLines.join('\n'),
      travelOptions: { source: hotelCity, destination: '', options: { bus: [], train: [], flight: [], hotels } },
    };
  }

  let busRoutes = [];
  let trainRoutes = [];

  if (requestedMode === 'bus') {
    busRoutes = await queryRoutes('bus', { source, destination, budgetCap });
  } else if (requestedMode === 'train') {
    trainRoutes = await queryRoutes('train', { source, destination, budgetCap });
  } else if (requestedMode === 'all') {
    [busRoutes, trainRoutes] = await Promise.all([
      queryRoutes('bus', { source, destination, budgetCap }),
      queryRoutes('train', { source, destination, budgetCap }),
    ]);
  }

  return {
    shouldUseDatabase: requestedMode === 'bus' || requestedMode === 'train' || requestedMode === 'all',
    requestedMode,
    entities: {
      ...normalizedEntities,
      source,
      destination,
    },
    routeResults: {
      requestedMode,
      totalMatches: busRoutes.length + trainRoutes.length,
      bus: busRoutes,
      train: trainRoutes,
    },
    itinerary: buildItinerary({
      source,
      destination,
      requestedMode,
      budgetCap,
      busRoutes,
      trainRoutes,
    }),
    travelOptions: buildTravelOptions(source, destination, busRoutes, trainRoutes),
  };
}

module.exports = {
  findRelevantRoutes,
  normalizeTravelMode,
};
