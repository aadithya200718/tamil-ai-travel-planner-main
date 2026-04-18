import { useState, useCallback } from 'react';
import BookingForm from './BookingForm';
import BookingConfirmation from './BookingConfirmation';

/**
 * ItineraryDisplay component.
 * Shows the generated itinerary text, travel options with booking, and a "Read aloud" (TTS) button.
 *
 * Props:
 *   result: object — the response from the backend
 */
export default function ItineraryDisplay({ result }) {
  const speak = useCallback(() => {
    if (!result?.itinerary) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(result.itinerary);
    // Prefer Tamil voice if available
    const voices = window.speechSynthesis.getVoices();
    const tamilVoice = voices.find(v => v.lang.startsWith('ta'));
    if (tamilVoice) utterance.voice = tamilVoice;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [result]);

  if (!result) return null;

  const source = result.entities?.source || result.travelOptions?.source || '';
  const destination = result.entities?.destination || result.travelOptions?.destination || '';

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#2c3e50' }}>📋 பயண திட்டம்</h2>
        <button onClick={speak} style={speakBtnStyle} title="Read itinerary aloud">
          🔊 கேளுங்கள்
        </button>
      </div>

      {/* Meta info */}
      <div style={{ marginBottom: 10, fontSize: 13, color: '#555' }}>
        <span style={badgeStyle('#3498db')}>{result.intent || 'plan_trip'}</span>
        {result.entities?.source && (
          <span style={badgeStyle('#27ae60')}>📍 {result.entities.source}</span>
        )}
        {result.entities?.destination && (
          <span style={badgeStyle('#e67e22')}>🏁 {result.entities.destination}</span>
        )}
        {result.entities?.date && (
          <span style={badgeStyle('#9b59b6')}>📅 {result.entities.date}</span>
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
          🎤 Whisper ({result.transcriptionInfo.language}) — confidence: {(result.transcriptionInfo.confidence * 100).toFixed(0)}%
        </div>
      )}

      {/* Itinerary text */}
      <pre style={itineraryStyle}>{result.itinerary}</pre>

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
  const sections = [
    { key: 'bus', title: '🚌 பேருந்து தரவுகள்', rows: routeResults.bus || [] },
    { key: 'train', title: '🚂 ரயில் தரவுகள்', rows: routeResults.train || [] },
  ].filter(section => section.rows.length > 0);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 15, marginBottom: 8, color: '#2c3e50' }}>📚 தரவுத்தள முடிவுகள்</h3>
      {sections.map(section => (
        <div key={section.key} style={{ marginBottom: 16 }}>
          <div style={sectionTitleBadgeStyle}>{section.title}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={thStyle}>புறப்படும் இடம்</th>
                <th style={thStyle}>செல்லும் இடம்</th>
                <th style={thStyle}>சேவை வகை</th>
                <th style={thStyle}>எண்</th>
                <th style={thStyle}>தூரம்</th>
                <th style={thStyle}>கட்டணம்</th>
                <th style={thStyle}>ஏறத்தாழ நேரம்</th>
                <th style={thStyle}>பதிவு</th>
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

function RouteResultRow({ row, index }) {
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
        <td style={tdStyle}>{row.source}</td>
        <td style={tdStyle}>{row.destination}</td>
        <td style={tdStyle}>{row.serviceType}</td>
        <td style={tdStyle}>{row.trainNumber || '-'}</td>
        <td style={tdStyle}>{row.distanceKm} கிமீ</td>
        <td style={tdStyle}>₹{row.price}</td>
        <td style={tdStyle}>{row.duration}</td>
        <td style={tdStyle}>
          <button
            onClick={() => setShowBooking(!showBooking)}
            style={showBooking ? closeBtnStyle : bookBtnStyle}
          >
            {showBooking ? '✕ மூடு' : '🎫 பதிவு செய்'}
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
  const allOptions = [
    ...(options.train || []).map(t => ({ type: 'Train 🚂', ...t })),
    ...(options.bus || []).map(b => ({ type: 'Bus 🚌', ...b })),
    ...(options.flight || []).map(f => ({ type: 'Flight ✈️', ...f })),
  ];

  if (allOptions.length === 0) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 15, marginBottom: 8, color: '#2c3e50' }}>🎫 பயண விருப்பங்கள்</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={thStyle}>வகை</th>
            <th style={thStyle}>பெயர்</th>
            <th style={thStyle}>கட்டணம்</th>
            <th style={thStyle}>நேரம்</th>
            <th style={thStyle}>பதிவு</th>
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
        <td style={tdStyle}>{option.type}</td>
        <td style={tdStyle}>{option.name}</td>
        <td style={tdStyle}>₹{option.price}</td>
        <td style={tdStyle}>{option.duration}</td>
        <td style={tdStyle}>
          <button
            onClick={() => setShowBooking(!showBooking)}
            style={showBooking ? closeBtnStyle : bookBtnStyle}
          >
            {showBooking ? '✕ மூடு' : '🎫 பதிவு செய்'}
          </button>
        </td>
      </tr>
      {showBooking && (
        <tr>
          <td colSpan="5" style={{ padding: '0 8px' }}>
            <BookingForm
              travelOption={option}
              source={source}
              destination={destination}
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
