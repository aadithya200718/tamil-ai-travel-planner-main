import { useState, useCallback } from 'react';
import BookingForm from './BookingForm';
import BookingConfirmation from './BookingConfirmation';
import { useLanguage } from '../context/LanguageContext';

/**
 * ItineraryDisplay component.
 * Shows the generated itinerary text, travel options with booking, and a "Read aloud" (TTS) button.
 *
 * Props:
 *   result: object — the response from the backend
 */
export default function ItineraryDisplay({ result }) {
  const { language, ui } = useLanguage();
  const speak = useCallback(() => {
    if (!result?.itinerary) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ui(result.itinerary));
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith(language === 'en' ? 'en' : 'ta'));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [language, result, ui]);

  if (!result) return null;

  const source = result.entities?.source || result.travelOptions?.source || '';
  const destination = result.entities?.destination || result.travelOptions?.destination || '';

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#2c3e50' }}>📋 {ui('பயண திட்டம்')}</h2>
        <button onClick={speak} style={speakBtnStyle} title={ui('கேளுங்கள்')}>
          🔊 {ui('கேளுங்கள்')}
        </button>
      </div>

      {/* Meta info */}
      <div style={{ marginBottom: 10, fontSize: 13, color: '#555' }}>
        <span style={badgeStyle('#3498db')}>{ui(result.intent || 'plan_trip')}</span>
        {result.entities?.source && (
          <span style={badgeStyle('#27ae60')}>📍 {ui(result.entities.source)}</span>
        )}
        {result.entities?.destination && (
          <span style={badgeStyle('#e67e22')}>🏁 {ui(result.entities.destination)}</span>
        )}
        {result.entities?.date && (
          <span style={badgeStyle('#9b59b6')}>📅 {ui(result.entities.date)}</span>
        )}
      </div>

      {/* Transcript */}
      {result.transcript && (
        <div style={{ marginBottom: 10, fontSize: 13, color: '#666', fontStyle: 'italic' }}>
          💬 &quot;{result.transcript}&quot;
        </div>
      )}

      {/* Transcription confidence (from voice input) */}
      {result.transcriptionInfo && (
        <div style={{ marginBottom: 10, fontSize: 12, color: '#888' }}>
          🎤 Whisper ({result.transcriptionInfo.language}) - confidence: {(result.transcriptionInfo.confidence * 100).toFixed(0)}%
        </div>
      )}

      {/* Itinerary text */}
      <pre style={itineraryStyle}>{ui(result.itinerary)}</pre>

      {result.routeResults ? (
        <RouteResultsTable routeResults={result.routeResults} />
      ) : (
        result.travelOptions?.options && (
          <TravelOptionsTable
            options={result.travelOptions.options}
            source={source}
            destination={destination}
          />
        )
      )}
    </div>
  );
}

function RouteResultsTable({ routeResults }) {
  const { ui } = useLanguage();
  const hotels = routeResults.hotels || [];
  const sections = [
    { key: 'bus', title: `🚌 ${ui('பேருந்து தரவுகள்')}`, rows: routeResults.bus || [] },
    { key: 'train', title: `🚂 ${ui('ரயில் தரவுகள்')}`, rows: routeResults.train || [] },
  ].filter(section => section.rows.length > 0);

  if (sections.length === 0 && hotels.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 15, marginBottom: 8, color: '#2c3e50' }}>📚 {ui('தரவுத்தள முடிவுகள்')}</h3>
      {hotels.length > 0 && <HotelResultsList hotels={hotels} />}
      {sections.map(section => (
        <div key={section.key} style={{ marginBottom: 16 }}>
          <div style={sectionTitleBadgeStyle}>{section.title}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={thStyle}>{ui('புறப்படும் இடம்')}</th>
                <th style={thStyle}>{ui('செல்லும் இடம்')}</th>
                <th style={thStyle}>{ui('சேவை வகை')}</th>
                <th style={thStyle}>{ui('எண்')}</th>
                <th style={thStyle}>{ui('தூரம்')}</th>
                <th style={thStyle}>{ui('கட்டணம்')}</th>
                <th style={thStyle}>{ui('ஏறத்தாழ நேரம்')}</th>
                <th style={thStyle}>{ui('பதிவு')}</th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, index) => (
                <RouteResultRow key={`${section.key}-${row.id}`} row={row} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function HotelResultsList({ hotels }) {
  const { ui } = useLanguage();
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={sectionTitleBadgeStyle}>🏨 {ui('தங்கும் விடுதி தரவுகள்')}</div>
      <div style={hotelGridStyle}>
        {hotels.map((hotel, index) => (
          <HotelResultCard key={`hotel-${hotel.id || index}`} hotel={hotel} />
        ))}
      </div>
    </div>
  );
}

function HotelResultCard({ hotel }) {
  const { ui } = useLanguage();
  const [showBooking, setShowBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const amenities = String(hotel.amenities || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  const bookingOption = {
    type: 'hotel',
    routeId: hotel.id,
    name: hotel.name,
    price: hotel.pricePerNight,
    duration: ui('1 இரவு'),
    serviceType: hotel.hotelType,
    referenceNumber: `${hotel.starRating || 0} star`,
  };

  if (bookingResult) {
    return (
      <div style={hotelCardStyle}>
        <BookingConfirmation
          booking={bookingResult.booking}
          onCancelled={() => {
            // no-op for now
          }}
        />
      </div>
    );
  }

  return (
    <div style={hotelCardStyle}>
      <div style={hotelHeaderStyle}>
        <div>
          <h4 style={hotelTitleStyle}>{hotel.name}</h4>
          <div style={hotelMetaStyle}>
             {ui(hotel.city)} · {ui(hotel.hotelType)} · {hotel.starRating || '-'}★
          </div>
        </div>
        <div style={hotelPriceStyle}>₹{hotel.pricePerNight}</div>
      </div>
      {hotel.description && <p style={hotelDescriptionStyle}>{ui(hotel.description)}</p>}
      <div style={hotelMetaStyle}>
        {ui('மதிப்பீடு:')} {hotel.rating || '-'} ({hotel.totalReviews || 0} reviews)
      </div>
      {amenities.length > 0 && (
        <div style={amenitiesStyle}>
          {amenities.map(item => (
            <span key={item} style={amenityStyle}>{ui(item)}</span>
          ))}
        </div>
      )}
      <button
        onClick={() => setShowBooking(!showBooking)}
        style={showBooking ? closeBtnStyle : bookBtnStyle}
      >
        {showBooking ? `✕ ${ui('மூடு')}` : `🎫 ${ui('பதிவு செய்')}`}
      </button>
      {showBooking && (
        <BookingForm
          travelOption={bookingOption}
          source={hotel.city}
          destination={hotel.name}
          onBookingComplete={(data) => {
            setBookingResult(data);
            setShowBooking(false);
          }}
          onCancel={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}

function RouteResultRow({ row, index }) {
  const { ui } = useLanguage();
  const [showBooking, setShowBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  function handleBookingComplete(data) {
    setBookingResult(data);
    setShowBooking(false);
  }

  if (bookingResult) {
    return (
      <tr>
        <td colSpan="8" style={{ padding: 0 }}>
          <BookingConfirmation
            booking={bookingResult.booking}
            onCancelled={() => {
              // no-op for now
            }}
          />
        </td>
      </tr>
    );
  }

  const bookingOption = {
    type: row.mode,
    routeId: row.id,
    name: row.name,
    price: row.price,
    duration: row.duration,
    serviceType: row.serviceType,
    referenceNumber: row.trainNumber || '',
  };

  return (
    <>
      <tr style={{ background: index % 2 === 0 ? '#fafafa' : '#fff' }}>
        <td style={tdStyle}>{ui(row.source)}</td>
        <td style={tdStyle}>{ui(row.destination)}</td>
        <td style={tdStyle}>{ui(row.serviceType)}</td>
        <td style={tdStyle}>{row.trainNumber || '-'}</td>
        <td style={tdStyle}>{row.distanceKm} {ui('கிமீ')}</td>
        <td style={tdStyle}>₹{row.price}</td>
        <td style={tdStyle}>{ui(row.duration)}</td>
        <td style={tdStyle}>
          <button
            onClick={() => setShowBooking(!showBooking)}
            style={showBooking ? closeBtnStyle : bookBtnStyle}
          >
            {showBooking ? `✕ ${ui('மூடு')}` : `🎫 ${ui('பதிவு செய்')}`}
          </button>
        </td>
      </tr>
      {showBooking && (
        <tr>
          <td colSpan="8" style={{ padding: '0 8px' }}>
            <BookingForm
              travelOption={bookingOption}
              source={row.source}
              destination={row.destination}
              onBookingComplete={handleBookingComplete}
              onCancel={() => setShowBooking(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function TravelOptionsTable({ options, source, destination }) {
  const { ui } = useLanguage();
  const allOptions = [
    ...(options.train || []).map(t => ({ type: 'Train 🚂', ...t })),
    ...(options.bus || []).map(b => ({ type: 'Bus 🚌', ...b })),
    ...(options.flight || []).map(f => ({ type: 'Flight ✈️', ...f })),
    ...(options.hotels || []).map(h => ({
      type: 'Hotel 🏨',
      name: h.name,
      price: h.pricePerNight,
      duration: ui('1 இரவு'),
      source: h.city,
      destination: h.name,
      serviceType: h.hotelType,
      routeId: h.id,
    })),
  ];

  if (allOptions.length === 0) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 15, marginBottom: 8, color: '#2c3e50' }}>🎫 {ui('பயண விருப்பங்கள்')}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={thStyle}>{ui('வகை')}</th>
            <th style={thStyle}>{ui('பெயர்')}</th>
            <th style={thStyle}>{ui('கட்டணம்')}</th>
            <th style={thStyle}>{ui('நேரம்')}</th>
            <th style={thStyle}>{ui('பதிவு')}</th>
          </tr>
        </thead>
        <tbody>
          {allOptions.map((opt, i) => (
            <TravelOptionRow
              key={i}
              option={opt}
              index={i}
              source={source}
              destination={destination}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TravelOptionRow({ option, index, source, destination }) {
  const { ui } = useLanguage();
  const [showBooking, setShowBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  function handleBookingComplete(data) {
    setBookingResult(data);
    setShowBooking(false);
  }

  // Show confirmation after booking
  if (bookingResult) {
    return (
      <tr>
        <td colSpan="5" style={{ padding: 0 }}>
          <BookingConfirmation
            booking={bookingResult.booking}
            onCancelled={() => {
              // Optionally update UI after cancel
            }}
          />
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr style={{ background: index % 2 === 0 ? '#fafafa' : '#fff' }}>
        <td style={tdStyle}>{ui(option.type)}</td>
        <td style={tdStyle}>{ui(option.name)}</td>
        <td style={tdStyle}>₹{option.price}</td>
        <td style={tdStyle}>{ui(option.duration)}</td>
        <td style={tdStyle}>
          <button
            onClick={() => setShowBooking(!showBooking)}
            style={showBooking ? closeBtnStyle : bookBtnStyle}
          >
            {showBooking ? `✕ ${ui('மூடு')}` : `🎫 ${ui('பதிவு செய்')}`}
          </button>
        </td>
      </tr>
      {showBooking && (
        <tr>
          <td colSpan="5" style={{ padding: '0 8px' }}>
            <BookingForm
              travelOption={option}
              source={option.source || source}
              destination={option.destination || destination}
              onBookingComplete={handleBookingComplete}
              onCancel={() => setShowBooking(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const cardStyle = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
  padding: 24,
  marginTop: 24,
};
const speakBtnStyle = {
  background: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '6px 14px',
  cursor: 'pointer',
  fontSize: 14,
};
const itineraryStyle = {
  background: '#f8f9fa',
  borderRadius: 8,
  padding: 16,
  whiteSpace: 'pre-wrap',
  fontFamily: 'inherit',
  fontSize: 14,
  lineHeight: 1.7,
  color: '#333',
};
const sectionTitleBadgeStyle = {
  display: 'inline-block',
  background: '#eef4ff',
  color: '#1f4ea3',
  borderRadius: 999,
  padding: '6px 12px',
  fontSize: 13,
  fontWeight: 600,
};
const hotelGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
  marginTop: 10,
};
const hotelCardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 14,
  background: '#fff',
};
const hotelHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'flex-start',
};
const hotelTitleStyle = {
  margin: 0,
  fontSize: 15,
  color: '#2c3e50',
};
const hotelMetaStyle = {
  fontSize: 12,
  color: '#666',
  marginTop: 4,
};
const hotelPriceStyle = {
  color: '#27ae60',
  fontWeight: 700,
  whiteSpace: 'nowrap',
};
const hotelDescriptionStyle = {
  margin: '10px 0 8px',
  color: '#333',
  fontSize: 13,
  lineHeight: 1.5,
};
const amenitiesStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  margin: '10px 0 12px',
};
const amenityStyle = {
  background: '#f3f4f6',
  color: '#4b5563',
  borderRadius: 999,
  padding: '3px 8px',
  fontSize: 11,
};
const thStyle = { padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ddd' };
const tdStyle = { padding: '7px 10px', borderBottom: '1px solid #eee' };
function badgeStyle(color) {
  return {
    display: 'inline-block',
    background: color,
    color: '#fff',
    borderRadius: 12,
    padding: '2px 10px',
    marginRight: 6,
    fontSize: 12,
  };
}
const bookBtnStyle = {
  background: '#3498db',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '6px 14px',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  transition: 'background 0.2s',
};
const closeBtnStyle = {
  background: '#95a5a6',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '6px 14px',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};
