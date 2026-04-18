import { useEffect, useMemo, useState } from 'react';
import RazorpayCheckout from './RazorpayCheckout';
import { cancelBooking, refundBookingPayment } from '../services/api';

export default function BookingConfirmation({ booking, onCancelled }) {
  const [currentBooking, setCurrentBooking] = useState(booking);
  const [paymentCompleted, setPaymentCompleted] = useState(() => hasCompletedPayment(booking));
  const [cancelling, setCancelling] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setCurrentBooking(booking);
    setPaymentCompleted(hasCompletedPayment(booking));
  }, [booking]);

  const userDetails = useMemo(
    () => ({
      customerName: localStorage.getItem('userName') || 'பயனர்',
      customerEmail: localStorage.getItem('userEmail') || '',
    }),
    []
  );

  const isCancelled = currentBooking.status === 'cancelled';
  const isPaid = currentBooking.paymentStatus === 'paid' || currentBooking.status === 'paid';
  const isRefunded = currentBooking.paymentStatus === 'refunded';
  const refundAmount = Number(currentBooking.refundAmount || 0);
  const canRefund = paymentCompleted && isCancelled && isPaid && !isRefunded && refundAmount > 0;

  async function handleCancel() {
    if (!window.confirm('இந்த பதிவை ரத்து செய்ய விரும்புகிறீர்களா?')) return;

    setCancelling(true);
    setError('');
    setMessage('');

    try {
      const data = await cancelBooking(currentBooking.bookingId);
      if (data.booking) {
        setCurrentBooking(data.booking);
        setPaymentCompleted(hasCompletedPayment(data.booking));
      }
      setMessage(data.message || 'பதிவு ரத்து செய்யப்பட்டது');
      onCancelled?.(data);
    } catch (err) {
      setError(err.message || 'ரத்து செய்ய இயலவில்லை');
    } finally {
      setCancelling(false);
    }
  }

  async function handleRefund() {
    setRefunding(true);
    setError('');
    setMessage('');

    try {
      const data = await refundBookingPayment({
        bookingId: currentBooking.bookingId,
        paymentId: currentBooking.paymentId,
        amount: refundAmount,
      });

      if (data.booking) {
        setCurrentBooking(data.booking);
        setPaymentCompleted(hasCompletedPayment(data.booking));
      }

      setMessage(data.message || 'பணம் திருப்பி அனுப்பும் செயல்முறை தொடங்கப்பட்டது');
    } catch (err) {
      setError(err.message || 'Refund தொடங்க முடியவில்லை');
    } finally {
      setRefunding(false);
    }
  }

  function handlePaymentSuccess(paymentData) {
    if (paymentData.booking) {
      setCurrentBooking(paymentData.booking);
      setPaymentCompleted(hasCompletedPayment(paymentData.booking));
    } else {
      setPaymentCompleted(true);
    }
    setMessage(paymentData.message || 'பணம் செலுத்துதல் வெற்றிகரமாக முடிந்தது! 🎉');
    setError('');
  }

  function handlePaymentFailure(err) {
    setError(err.message || 'பணம் செலுத்துதல் தோல்வியடைந்தது');
  }

  return (
    <div style={containerStyle(isCancelled, paymentCompleted || isPaid)}>
      <div style={headerStyle(isCancelled, paymentCompleted || isPaid)}>
        <span style={{ fontSize: 22 }}>
          {isRefunded ? '💸' : isCancelled ? '❌' : paymentCompleted ? '🎉' : '🧾'}
        </span>
        <span style={{ fontWeight: 700, fontSize: 17 }}>
          {isRefunded
            ? 'Refund செயல்முறை தொடங்கப்பட்டது'
            : isCancelled
              ? 'பதிவு ரத்து செய்யப்பட்டது'
              : paymentCompleted
                ? 'பணம் செலுத்துதல் முடிந்தது'
                : 'பதிவு உருவாக்கப்பட்டது'}
        </span>
      </div>

      {paymentCompleted && (
        <div style={detailsGridStyle}>
          <DetailRow label="பதிவு எண்" value={currentBooking.bookingId} highlight />
          <DetailRow label="PNR எண்" value={currentBooking.pnr} highlight />
          <DetailRow label="பயணம்" value={`${currentBooking.travelName} (${currentBooking.travelType})`} />
          <DetailRow label="வழித்தடம்" value={`${currentBooking.source} → ${currentBooking.destination}`} />
          <DetailRow label="பயணிகள்" value={`${currentBooking.passengers} நபர்`} />
          <DetailRow label="மொத்த கட்டணம்" value={`₹${currentBooking.totalPrice}`} />
          <DetailRow label="தொலைபேசி" value={currentBooking.contactPhone} />
          <DetailRow
            label="கட்டண நிலை"
            value={paymentStatusLabel(currentBooking.paymentStatus, currentBooking.status)}
            valueColor={paymentStatusColor(currentBooking.paymentStatus, currentBooking.status)}
          />
          {currentBooking.paymentId && <DetailRow label="Payment ID" value={currentBooking.paymentId} />}
          {currentBooking.refundId && <DetailRow label="Refund ID" value={currentBooking.refundId} />}
        </div>
      )}

      {message && <div style={successStyle}>✅ {message}</div>}
      {error && <div style={errorStyle}>⚠️ {error}</div>}

      {!isCancelled && !paymentCompleted && (
        <div style={paymentSectionStyle}>
          <RazorpayCheckout
            bookingDetails={{
              bookingId: currentBooking.bookingId,
              totalPrice: currentBooking.totalPrice,
              customerName: userDetails.customerName,
              customerEmail: userDetails.customerEmail,
              customerPhone: currentBooking.contactPhone,
              source: currentBooking.source,
              destination: currentBooking.destination,
            }}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
          />
        </div>
      )}

      {paymentCompleted && !isCancelled && !message && (
        <div style={successStyle}>✅ பணம் செலுத்துதல் வெற்றிகரமாக முடிந்தது! 🎉</div>
      )}

      {paymentCompleted && isCancelled && (
        <div style={refundInfoStyle}>
          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>
            {refundAmount > 0 ? `திருப்பி தொகை: ₹${refundAmount}` : 'திருப்பி தொகை இல்லை'}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
            {isRefunded
              ? 'Refund கோரிக்கை அனுப்பப்பட்டுள்ளது. Razorpay நிலையை சரிபார்க்கவும்.'
              : isPaid
                ? 'பணம் செலுத்திய பதிவுகளுக்கு மட்டுமே refund செயல்முறை கிடைக்கும்.'
                : 'இந்த பதிவு இன்னும் செலுத்தப்படாததால் refund தேவையில்லை.'}
          </p>
        </div>
      )}

      {canRefund && (
        <button onClick={handleRefund} disabled={refunding} style={refundBtnStyle(refunding)}>
          {refunding ? '⏳ Refund தொடங்குகிறது...' : '💸 Refund தொடங்கு'}
        </button>
      )}

      {paymentCompleted && !isCancelled && (
        <div style={{ marginTop: 16 }}>
          <div style={policyStyle}>
            <strong>ரத்து விதிமுறை:</strong><br />
            • 1 மணி நேரத்திற்குள் — 100% பணம் திருப்பி<br />
            • 1-24 மணி நேரம் — 50% பணம் திருப்பி<br />
            • 24 மணி நேரத்திற்கு மேல் — பணம் திருப்பி இல்லை
          </div>
          <button onClick={handleCancel} disabled={cancelling} style={cancelBtnStyle(cancelling)}>
            {cancelling ? '⏳ ரத்து செய்கிறது...' : '✖ ரத்து செய்'}
          </button>
        </div>
      )}
    </div>
  );
}

function hasCompletedPayment(booking) {
  return booking?.paymentStatus === 'paid' || booking?.paymentStatus === 'refunded' || booking?.status === 'paid';
}

function paymentStatusLabel(paymentStatus, status) {
  if (paymentStatus === 'refunded') return 'திருப்பி அனுப்பப்பட்டது';
  if (paymentStatus === 'paid' || status === 'paid') return 'செலுத்தப்பட்டது';
  if (paymentStatus === 'failed') return 'தோல்வி';
  if (status === 'cancelled') return 'ரத்து செய்யப்பட்டது';
  return 'நிலுவையில் உள்ளது';
}

function paymentStatusColor(paymentStatus, status) {
  if (paymentStatus === 'refunded') return '#8e44ad';
  if (paymentStatus === 'paid' || status === 'paid') return '#27ae60';
  if (paymentStatus === 'failed') return '#c0392b';
  if (status === 'cancelled') return '#c0392b';
  return '#d97706';
}

function DetailRow({ label, value, highlight = false, valueColor = '' }) {
  return (
    <div style={detailRowStyle}>
      <span style={{ color: '#666', fontSize: 13 }}>{label}:</span>
      <span
        style={{
          fontWeight: highlight ? 700 : 500,
          fontSize: highlight ? 15 : 14,
          color: valueColor || (highlight ? '#2c3e50' : '#333'),
          fontFamily: highlight ? 'monospace' : 'inherit',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function containerStyle(cancelled, paid) {
  return {
    background: cancelled ? '#fff5f5' : paid ? '#eefaf2' : '#fffdf5',
    border: `1px solid ${cancelled ? '#fcc' : paid ? '#c6f6d5' : '#f3d98b'}`,
    borderRadius: 10,
    padding: 20,
    marginTop: 12,
  };
}

function headerStyle(cancelled, paid) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    color: cancelled ? '#c0392b' : paid ? '#27ae60' : '#d97706',
  };
}

const detailsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '8px 16px',
};

const detailRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const paymentSectionStyle = {
  marginTop: 18,
};

const refundInfoStyle = {
  marginTop: 16,
  padding: '12px 16px',
  background: '#fffae6',
  border: '1px solid #ffe58f',
  borderRadius: 8,
};

const successStyle = {
  color: '#166534',
  fontSize: 13,
  marginTop: 12,
  padding: '10px 12px',
  background: '#e7f8ee',
  border: '1px solid #b7e4c7',
  borderRadius: 6,
};

const errorStyle = {
  color: '#c0392b',
  fontSize: 13,
  marginTop: 12,
  padding: '10px 12px',
  background: '#fde8e8',
  borderRadius: 6,
};

const policyStyle = {
  fontSize: 12,
  color: '#666',
  lineHeight: 1.6,
  marginBottom: 12,
  padding: '8px 12px',
  background: '#f8f9fa',
  borderRadius: 6,
};

function cancelBtnStyle(disabled) {
  return {
    background: disabled ? '#ccc' : '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  };
}

function refundBtnStyle(disabled) {
  return {
    marginTop: 14,
    background: disabled ? '#c7b8e6' : '#8e44ad',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  };
}
