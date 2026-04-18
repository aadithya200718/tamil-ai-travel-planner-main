const { getDb } = require('../db');
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

function buildWhereClause({ source, destination, budgetCap }, values) {
  const where = [];

  if (source && destination) {
    values.push(source, destination);
    where.push(`source = $${values.length - 1}`);
    where.push(`destination = $${values.length}`);
  } else if (source) {
    values.push(source);
    where.push(`(source = $${values.length} OR destination = $${values.length})`);
  } else if (destination) {
    values.push(destination);
    where.push(`(source = $${values.length} OR destination = $${values.length})`);
  }

  if (budgetCap) {
    values.push(budgetCap);
    where.push(`price_inr <= $${values.length}`);
  }

  return where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
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

async function queryRoutes(mode, filters) {
  const db = await getDb();
  const values = [];
  const whereClause = buildWhereClause(filters, values);
  const tableName = mode === 'bus' ? 'bus_routes' : 'train_routes';
  const mapper = mode === 'bus' ? mapBusRow : mapTrainRow;
  const limit = filters.source && filters.destination ? 12 : 20;

  const result = await db.query(
    `SELECT *
     FROM ${tableName}
     ${whereClause}
     ORDER BY price_inr ASC, distance_km ASC, source ASC, destination ASC
     LIMIT ${limit}`,
    values
  );

  return result.rows.map(mapper);
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
