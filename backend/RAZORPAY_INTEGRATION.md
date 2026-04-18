# Razorpay Integration Guide for Tamil AI Travel Planner

## 🎯 Overview

This guide will help you integrate Razorpay payment gateway into your Tamil travel booking system.

---

## 💰 Razorpay Pricing

### **Is it Free?**

✅ **FREE**:
- Account creation
- API access
- Test mode (unlimited test transactions)
- Integration & development

💰 **PAID** (Only on successful transactions):
- **2% transaction fee** on each successful payment
- Example: ₹1000 booking → You receive ₹980 (₹20 Razorpay fee)
- **No setup fees**
- **No monthly fees**
- **No hidden charges**

### **Test Mode** (Completely Free)
- Use test API keys for development
- Unlimited test transactions
- No charges whatsoever
- Perfect for learning and testing

---

## 📋 Step-by-Step Setup

### **Step 1: Create Razorpay Account**

1. Go to [https://razorpay.com/](https://razorpay.com/)
2. Click "Sign Up" (Free)
3. Fill in your business details
4. Verify email and phone

### **Step 2: Get API Keys**

1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Generate Test Keys** (for development)
4. Copy:
   - **Key ID**: `rzp_test_xxxxxxxxxxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxxxxxxxxxxxx`

### **Step 3: Add to Environment Variables**

Add to `backend/.env`:

```env
# Razorpay Test Keys (FREE - for development)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

Add to `frontend/.env.local`:

```env
# Razorpay Public Key (visible in frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### **Step 4: Install Razorpay Package**

```bash
cd backend
npm install razorpay

cd ../frontend
# Razorpay checkout script is loaded via CDN (no npm install needed)
```

---

## 🔧 Backend Integration

### **Add Payment Routes to server.js**

Add these routes after your existing booking routes:

```javascript
// backend/server.js

const {
  createPaymentOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  initiateRefund,
} = require('./services/razorpayService');

// ─── Payment Routes ──────────────────────────────────────────────────────────

// POST /payment/create-order — Create Razorpay order for booking
app.post('/payment/create-order', apiLimiter, async (req, res) => {
  try {
    const { bookingId, totalPrice, customerName, customerEmail, customerPhone } = req.body;

    if (!bookingId || !totalPrice || !customerName || !customerPhone) {
      return res.status(400).json({
        error: 'பதிவு விவரங்கள் முழுமையாக இல்லை',
      });
    }

    const order = await createPaymentOrder({
      bookingId,
      totalPrice,
      customerName,
      customerEmail,
      customerPhone,
    });

    res.json({
      success: true,
      order,
      message: 'பணம் செலுத்தும் ஆர்டர் உருவாக்கப்பட்டது',
    });
  } catch (err) {
    console.error('POST /payment/create-order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /payment/verify — Verify Razorpay payment signature
app.post('/payment/verify', apiLimiter, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({
        error: 'பணம் செலுத்தும் விவரங்கள் முழுமையாக இல்லை',
      });
    }

    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'பணம் செலுத்தும் சரிபார்ப்பு தோல்வியடைந்தது',
      });
    }

    // Get payment details
    const paymentDetails = await getPaymentDetails(razorpay_payment_id);

    // Update booking status in database
    const db = await getDb();
    await db.query(
      `UPDATE bus_bookings SET status = 'paid', payment_id = $1 WHERE booking_id = $2`,
      [razorpay_payment_id, bookingId]
    );
    await db.query(
      `UPDATE train_bookings SET status = 'paid', payment_id = $1 WHERE booking_id = $2`,
      [razorpay_payment_id, bookingId]
    );
    await db.query(
      `UPDATE flight_bookings SET status = 'paid', payment_id = $1 WHERE booking_id = $2`,
      [razorpay_payment_id, bookingId]
    );

    res.json({
      success: true,
      payment: paymentDetails,
      message: 'பணம் செலுத்துதல் வெற்றிகரமாக முடிந்தது! 🎉',
    });
  } catch (err) {
    console.error('POST /payment/verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /payment/refund — Initiate refund for cancelled booking
app.post('/payment/refund', apiLimiter, async (req, res) => {
  try {
    const { paymentId, amount } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        error: 'பணம் செலுத்தும் ID தேவை',
      });
    }

    const refund = await initiateRefund(paymentId, amount);

    res.json({
      success: true,
      refund,
      message: 'பணம் திரும்பப் பெறுதல் தொடங்கப்பட்டது',
    });
  } catch (err) {
    console.error('POST /payment/refund error:', err);
    res.status(500).json({ error: err.message });
  }
});
```

### **Update Database Schema**

Add payment fields to booking tables in `backend/db.js`:

```javascript
const bookingSchemaPart = `
  id SERIAL PRIMARY KEY,
  booking_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  travel_name TEXT NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  travel_date TEXT,
  passengers INTEGER NOT NULL,
  price_per_person INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  contact_phone TEXT NOT NULL,
  pnr TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,                          -- NEW: Razorpay payment ID
  payment_status TEXT DEFAULT 'pending',    -- NEW: pending, paid, failed, refunded
  refund_id TEXT,                           -- NEW: Razorpay refund ID
  refund_amount INTEGER DEFAULT 0,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
`;
```

---

## 🎨 Frontend Integration

### **Update BookingConfirmation Component**

```javascript
// frontend/components/BookingConfirmation.js

import { useState } from 'react';
import RazorpayCheckout from './RazorpayCheckout';

export default function BookingConfirmation({ booking, onClose }) {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  function handlePaymentSuccess(paymentData) {
    setPaymentSuccess(true);
    alert(`பணம் செலுத்துதல் வெற்றி! 🎉\nபணம் செலுத்தும் ID: ${paymentData.payment.id}`);
  }

  function handlePaymentFailure(error) {
    setPaymentError(error.message);
    alert(`பணம் செலுத்துதல் தோல்வி: ${error.message}`);
  }

  return (
    <div style={modalStyle}>
      <div style={cardStyle}>
        <h2>🎉 பதிவு உறுதிப்படுத்தப்பட்டது!</h2>
        
        <div style={detailsStyle}>
          <p><strong>பதிவு எண்:</strong> {booking.bookingId}</p>
          <p><strong>PNR:</strong> {booking.pnr}</p>
          <p><strong>பயண பெயர்:</strong> {booking.travelName}</p>
          <p><strong>மொத்த விலை:</strong> ₹{booking.totalPrice}</p>
        </div>

        {!paymentSuccess && (
          <>
            <h3 style={{ marginTop: 24 }}>பணம் செலுத்து</h3>
            <RazorpayCheckout
              bookingDetails={{
                bookingId: booking.bookingId,
                totalPrice: booking.totalPrice,
                customerName: booking.customerName || 'Guest',
                customerEmail: booking.customerEmail || '',
                customerPhone: booking.contactPhone,
                source: booking.source,
                destination: booking.destination,
              }}
              onSuccess={handlePaymentSuccess}
              onFailure={handlePaymentFailure}
            />
          </>
        )}

        {paymentSuccess && (
          <div style={successStyle}>
            ✅ பணம் செலுத்துதல் வெற்றிகரமாக முடிந்தது!
          </div>
        )}

        {paymentError && (
          <div style={errorStyle}>
            ❌ {paymentError}
          </div>
        )}

        <button onClick={onClose} style={closeBtnStyle}>
          மூடு
        </button>
      </div>
    </div>
  );
}

// ... styles
```

---

## 🧪 Testing

### **Test Cards (FREE - No Real Money)**

Use these test cards in test mode:

| Card Number | Type | Result |
|-------------|------|--------|
| `4111 1111 1111 1111` | Visa | Success |
| `5555 5555 5555 4444` | Mastercard | Success |
| `4000 0000 0000 0002` | Visa | Failure |

**Test Details:**
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)
- Name: Any name

### **Test Payment Flow**

1. Start your backend: `cd backend && node server.js`
2. Start your frontend: `cd frontend && npm run dev`
3. Create a booking
4. Click "பணம் செலுத்து" button
5. Use test card: `4111 1111 1111 1111`
6. Complete payment
7. Check console for payment verification

---

## 🚀 Going Live (Production)

### **Step 1: Complete KYC**

1. Login to Razorpay Dashboard
2. Go to **Settings** → **Account & Settings**
3. Complete KYC verification (business documents required)

### **Step 2: Get Live API Keys**

1. Go to **Settings** → **API Keys**
2. Click **Generate Live Keys**
3. Update `.env` with live keys:

```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### **Step 3: Enable Payment Methods**

1. Go to **Settings** → **Payment Methods**
2. Enable: Cards, UPI, Netbanking, Wallets

### **Step 4: Test Live Payments**

- Use real cards with small amounts (₹1-10)
- Verify payment flow
- Check refund process

---

## 📊 Transaction Fees

| Payment Method | Fee |
|----------------|-----|
| Credit Card | 2% |
| Debit Card | 2% |
| UPI | 2% |
| Netbanking | 2% |
| Wallets | 2% |

**Example:**
- Booking: ₹1000
- Razorpay Fee: ₹20 (2%)
- You Receive: ₹980

---

## 🔒 Security Best Practices

1. ✅ Never expose `RAZORPAY_KEY_SECRET` in frontend
2. ✅ Always verify payment signature on backend
3. ✅ Use HTTPS in production
4. ✅ Store payment IDs in database
5. ✅ Implement webhook for payment notifications

---

## 📞 Support

- **Razorpay Docs**: https://razorpay.com/docs/
- **Test Mode**: https://razorpay.com/docs/payments/payments/test-card-details/
- **Support**: support@razorpay.com

---

## ✅ Checklist

- [ ] Create Razorpay account
- [ ] Get test API keys
- [ ] Add keys to `.env`
- [ ] Install `razorpay` package
- [ ] Add payment routes to backend
- [ ] Update database schema
- [ ] Create RazorpayCheckout component
- [ ] Test with test cards
- [ ] Complete KYC for live mode
- [ ] Get live API keys
- [ ] Test live payments
- [ ] Go live! 🚀

---

**Total Cost**: ₹0 for development, 2% per transaction in production
