import { useState } from 'react';
import {
  createPaymentOrderForBooking,
  verifyBookingPayment,
} from '../services/api';
import { useLanguage } from '../context/LanguageContext';

let razorpayScriptPromise = null;

function loadRazorpayScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Unable to open Razorpay on this device'));
  }

  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error('Unable to load the Razorpay script'));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

export default function RazorpayCheckout({ bookingDetails, onSuccess, onFailure }) {
  const { ui } = useLanguage();
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    setLoading(true);

    try {
      const orderData = await createPaymentOrderForBooking({
        bookingId: bookingDetails.bookingId,
        customerName: bookingDetails.customerName,
        customerEmail: bookingDetails.customerEmail,
        customerPhone: bookingDetails.customerPhone,
      });

      const Razorpay = await loadRazorpayScript();
      const razorpay = new Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: ui('தமிழ் AI பயண திட்டமிடுபவர்'),
        description: `${ui('பதிவு எண்')}: ${bookingDetails.bookingId}`,
        order_id: orderData.order.orderId,
        prefill: {
          name: bookingDetails.customerName || ui('பயனர்'),
          email: bookingDetails.customerEmail || '',
          contact: bookingDetails.customerPhone || '',
        },
        notes: {
          booking_id: bookingDetails.bookingId,
          source: bookingDetails.source || '',
          destination: bookingDetails.destination || '',
        },
        theme: {
          color: '#2887ff',
        },
        handler: async (response) => {
          try {
            const verifyData = await verifyBookingPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingDetails.bookingId,
            });

            onSuccess(verifyData);
          } catch (err) {
            onFailure(err);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onFailure(new Error(ui('பணம் செலுத்துதல் ரத்து செய்யப்பட்டது')));
          },
        },
      });

      razorpay.on('payment.failed', (response) => {
        setLoading(false);
        const description = response?.error?.description || response?.error?.reason;
         onFailure(new Error(ui(description || 'பணம் செலுத்துதல் தோல்வியடைந்தது')));
      });

      razorpay.open();
    } catch (err) {
      setLoading(false);
      onFailure(err);
    }
  }

  return (
    <button onClick={handlePayment} disabled={loading} style={payButtonStyle(loading)}>
      {loading ? (
        <>
          <span style={spinnerStyle}></span>
          {ui('செயலாக்கம்…')}
        </>
      ) : (
        <>
          <i className="ri-secure-payment-line" style={{ marginRight: '8px' }}></i>
          ₹{bookingDetails.totalPrice} {ui('செலுத்து')}
        </>
      )}
    </button>
  );
}

function payButtonStyle(loading) {
  return {
    width: '100%',
    padding: '16px',
    borderRadius: '5rem',
    border: 'none',
    background: loading ? '#aaa' : '#2887ff',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  };
}

const spinnerStyle = {
  display: 'inline-block',
  width: 18,
  height: 18,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 0.6s linear infinite',
};
