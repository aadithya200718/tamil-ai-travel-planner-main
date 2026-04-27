import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * BookingForm component.
 * Displays a form to book a travel option with passengers count and phone number.
 *
 * Props:
 *   travelOption: object — { type, name, price, duration }
 *   source: string — Source city
 *   destination: string — Destination city
 *   onBookingComplete: (result) => void — Called on successful booking
 *   onCancel: () => void — Called when user cancels the form
 */
export default function BookingForm({ travelOption, source, destination, onBookingComplete, onCancel }) {
  const { ui } = useLanguage();
  const [passengers, setPassengers] = useState(1);
  const [phone, setPhone] = useState('');
  const [travelDate, setTravelDate] = useState(() => getTodayString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalPrice = (travelOption.price || 0) * passengers;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validate phone
    if (!/^\d{10}$/.test(phone)) {
      setError(ui('சரியான தொலைபேசி எண்ணை உள்ளிடவும் (10 இலக்கங்கள்)'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelOption: {
            type: travelOption.type,
            routeId: travelOption.routeId,
            name: travelOption.name,
            serviceType: travelOption.serviceType,
            referenceNumber: travelOption.referenceNumber,
            price: travelOption.price,
            duration: travelOption.duration,
          },
          passengers,
          contactPhone: phone,
          source: source || 'Unknown',
          destination: destination || 'Unknown',
          travelDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(ui(data.error || 'பதிவு தோல்வியடைந்தது'));
      }

      onBookingComplete(data);
    } catch (err) {
      setError(ui(err.message || 'பதிவு தோல்வியடைந்தது'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={formContainerStyle}>
      <div style={formHeaderStyle}>
        <h3 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
          🎫 {ui('பதிவு செய்யுங்கள்')}
        </h3>
        <button onClick={onCancel} style={closeBtnStyle} title={ui('மூடு')}>✕</button>
      </div>

      {/* Travel option summary */}
      <div style={summaryStyle}>
        <span style={{ fontWeight: 600 }}>{travelOption.name}</span>
        <span style={{ color: '#666', marginLeft: 8 }}>
          ({ui(travelOption.type)}) - ₹{travelOption.price}/{ui('நபர்')}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Passengers */}
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="passengers">
            👥 {ui('பயணிகள் எண்ணிக்கை')}:
          </label>
          <select
            id="passengers"
            value={passengers}
            onChange={(e) => setPassengers(parseInt(e.target.value, 10))}
            style={inputStyle}
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? ui('நபர்') : ui('நபர்கள்')}</option>
            ))}
          </select>
        </div>

        {/* Travel date */}
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="travelDate">
            📅 {ui('பயண தேதி')}:
          </label>
          <input
            id="travelDate"
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            min={getTodayString()}
            style={inputStyle}
            required
          />
        </div>

        {/* Phone */}
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="phone">
            📱 {ui('தொலைபேசி எண்')}:
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            style={inputStyle}
            required
            maxLength={10}
          />
        </div>

        {/* Total price */}
        <div style={totalStyle}>
          <span>💰 {ui('மொத்த கட்டணம்')}:</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#27ae60' }}>₹{totalPrice}</span>
        </div>

        {/* Error */}
        {error && (
          <div style={errorStyle}>⚠️ {error}</div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={submitBtnStyle(loading)}
        >
          {loading ? `⏳ ${ui('பதிவு செய்கிறது...')}` : `✓ ${ui('உறுதி செய்யுங்கள்')}`}
        </button>
      </form>
    </div>
  );
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const formContainerStyle = {
  background: '#f8f9fa',
  border: '1px solid #e0e0e0',
  borderRadius: 10,
  padding: 20,
  marginTop: 12,
};

const formHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  color: '#999',
  padding: '4px 8px',
};

const summaryStyle = {
  background: '#e8f4fd',
  padding: '8px 12px',
  borderRadius: 6,
  marginBottom: 16,
  fontSize: 14,
};

const fieldStyle = {
  marginBottom: 14,
};

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 600,
  color: '#333',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #ccc',
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
};

const totalStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderTop: '1px solid #eee',
  borderBottom: '1px solid #eee',
  marginBottom: 16,
  fontSize: 15,
  color: '#333',
};

const errorStyle = {
  color: '#c0392b',
  fontSize: 13,
  marginBottom: 12,
  padding: '8px 12px',
  background: '#fde8e8',
  borderRadius: 6,
};

function submitBtnStyle(disabled) {
  return {
    width: '100%',
    background: disabled ? '#aaa' : '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 20px',
    fontSize: 16,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  };
}
