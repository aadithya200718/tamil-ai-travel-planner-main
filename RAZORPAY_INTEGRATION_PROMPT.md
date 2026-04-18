# Razorpay Integration Prompt for Tamil AI Travel Planner

## 🎯 Prompt for AI Assistant

```
I need to integrate Razorpay payment gateway into my Tamil AI Travel Planner application. 

**Current Setup:**
- Backend: Node.js/Express (backend/server.js)
- Frontend: Next.js (frontend/)
- Database: PostgreSQL
- Booking tables: bus_bookings, train_bookings, flight_bookings, hotel_bookings

**What I Need:**

1. **Backend Integration:**
   - Add Razorpay payment routes to backend/server.js:
     - POST /payment/create-order (create Razorpay order)
     - POST /payment/verify (verify payment signature)
     - POST /payment/refund (initiate refund)
   - Use the razorpayService.js file already created in backend/services/
   - Update booking tables to include payment_id and payment_status fields
   - Integrate payment verification with existing booking flow

2. **Frontend Integration:**
   - Update BookingConfirmation component (frontend/components/BookingConfirmation.js)
   - Add RazorpayCheckout component (already created in frontend/components/RazorpayCheckout.js)
   - Show payment button after booking is created
   - Handle payment success/failure with Tamil messages
   - Update booking status after successful payment

3. **Database Updates:**
   - Add payment_id, payment_status, refund_id columns to all booking tables
   - Update booking status from 'confirmed' to 'paid' after payment

4. **Environment Variables:**
   - Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env
   - Add NEXT_PUBLIC_RAZORPAY_KEY_ID to frontend/.env.local

5. **Tamil Language Support:**
   - All payment messages should be in Tamil
   - Error messages in Tamil
   - Success messages in Tamil

**Files to Modify:**
- backend/server.js (add payment routes)
- backend/db.js (update schema)
- frontend/components/BookingConfirmation.js (add payment UI)
- backend/.env (add Razorpay keys)
- frontend/.env.local (add public key)

**Files Already Created:**
- backend/services/razorpayService.js ✅
- frontend/components/RazorpayCheckout.js ✅
- backend/RAZORPAY_INTEGRATION.md ✅

**Requirements:**
- Use test mode keys (rzp_test_xxxxx)
- Verify payment signature on backend for security
- Update booking status after successful payment
- Support refunds for cancelled bookings
- Tamil language for all user-facing messages

Please integrate Razorpay payment gateway following the structure in backend/RAZORPAY_INTEGRATION.md and using the service files already created.
```

---

## 🎯 Alternative Shorter Prompt

```
Integrate Razorpay payment gateway into my Tamil AI Travel Planner:

1. Add payment routes to backend/server.js using backend/services/razorpayService.js
2. Update BookingConfirmation.js to use frontend/components/RazorpayCheckout.js
3. Add payment_id and payment_status columns to booking tables in backend/db.js
4. Use Tamil language for all payment messages
5. Follow the guide in backend/RAZORPAY_INTEGRATION.md

Files already created:
- backend/services/razorpayService.js
- frontend/components/RazorpayCheckout.js
- backend/RAZORPAY_INTEGRATION.md

Just need to connect them to the existing booking flow.
```

---

## 🎯 Step-by-Step Prompt (Most Detailed)

```
I need help integrating Razorpay payment gateway into my Tamil travel booking app. Here's what I need:

**STEP 1: Backend Payment Routes**
Add these routes to backend/server.js after the booking routes:
- POST /payment/create-order - Creates Razorpay order using createPaymentOrder() from razorpayService.js
- POST /payment/verify - Verifies payment using verifyPaymentSignature() from razorpayService.js
- POST /payment/refund - Initiates refund using initiateRefund() from razorpayService.js

Import statement needed:
```javascript
const {
  createPaymentOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  initiateRefund,
} = require('./services/razorpayService');
```

**STEP 2: Database Schema Update**
Update backend/db.js booking tables to add:
- payment_id TEXT (stores Razorpay payment ID)
- payment_status TEXT DEFAULT 'pending' (pending, paid, failed, refunded)
- refund_id TEXT (stores Razorpay refund ID)

**STEP 3: Frontend Payment Component**
Update frontend/components/BookingConfirmation.js to:
- Import RazorpayCheckout component
- Show payment button after booking is created
- Pass booking details to RazorpayCheckout
- Handle payment success (show success message in Tamil)
- Handle payment failure (show error message in Tamil)
- Update booking status after payment

**STEP 4: Environment Variables**
Add to backend/.env:
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

Add to frontend/.env.local:
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

**STEP 5: Install Package**
Run: npm install razorpay (in backend directory)

**STEP 6: Payment Verification Flow**
After payment success:
1. Verify signature on backend
2. Update booking status to 'paid'
3. Store payment_id in database
4. Show success message in Tamil

**Tamil Messages Needed:**
- Success: "பணம் செலுத்துதல் வெற்றிகரமாக முடிந்தது! 🎉"
- Failure: "பணம் செலுத்துதல் தோல்வியடைந்தது"
- Cancelled: "பணம் செலுத்துதல் ரத்து செய்யப்பட்டது"

**Reference Files:**
- backend/RAZORPAY_INTEGRATION.md (complete guide)
- backend/services/razorpayService.js (payment service)
- frontend/components/RazorpayCheckout.js (payment UI)

Please implement this integration step by step.
```

---

## 🎯 Quick Copy-Paste Prompt

```
Integrate Razorpay into my Tamil travel app:

1. Add payment routes to backend/server.js:
   - POST /payment/create-order
   - POST /payment/verify  
   - POST /payment/refund
   Use functions from backend/services/razorpayService.js

2. Update backend/db.js booking tables:
   - Add payment_id TEXT
   - Add payment_status TEXT DEFAULT 'pending'
   - Add refund_id TEXT

3. Update frontend/components/BookingConfirmation.js:
   - Import RazorpayCheckout from './RazorpayCheckout'
   - Add payment button
   - Handle success/failure in Tamil

4. Add env variables:
   - backend/.env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
   - frontend/.env.local: NEXT_PUBLIC_RAZORPAY_KEY_ID

5. Install: npm install razorpay (in backend)

Files already exist:
- backend/services/razorpayService.js
- frontend/components/RazorpayCheckout.js
- backend/RAZORPAY_INTEGRATION.md

Just connect them to the booking flow. Use Tamil for all messages.
```

---

## 🎯 Prompt for Specific File Updates

### **For backend/server.js:**
```
Add Razorpay payment routes to backend/server.js after the booking routes.

Import:
```javascript
const {
  createPaymentOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  initiateRefund,
} = require('./services/razorpayService');
```

Add routes:
1. POST /payment/create-order - Create Razorpay order
2. POST /payment/verify - Verify payment signature and update booking status
3. POST /payment/refund - Initiate refund

Follow the code examples in backend/RAZORPAY_INTEGRATION.md lines 50-150.
```

### **For backend/db.js:**
```
Update the bookingSchemaPart in backend/db.js to add payment fields:

Add these lines after 'pnr TEXT NOT NULL,':
```javascript
payment_id TEXT,
payment_status TEXT DEFAULT 'pending',
refund_id TEXT,
```

This applies to all 4 booking tables: bus_bookings, train_bookings, flight_bookings, hotel_bookings.
```

### **For frontend/components/BookingConfirmation.js:**
```
Update BookingConfirmation component to integrate Razorpay payment:

1. Import RazorpayCheckout:
```javascript
import RazorpayCheckout from './RazorpayCheckout';
```

2. Add state for payment:
```javascript
const [paymentSuccess, setPaymentSuccess] = useState(false);
const [paymentError, setPaymentError] = useState('');
```

3. Add payment handlers:
```javascript
function handlePaymentSuccess(paymentData) {
  setPaymentSuccess(true);
  alert('பணம் செலுத்துதல் வெற்றி! 🎉');
}

function handlePaymentFailure(error) {
  setPaymentError(error.message);
}
```

4. Add RazorpayCheckout component in the JSX after booking details.

Follow the example in backend/RAZORPAY_INTEGRATION.md lines 200-250.
```

---

## 📋 Checklist Prompt

```
Complete Razorpay integration checklist:

Backend:
[ ] Install razorpay package: npm install razorpay
[ ] Add RAZORPAY_KEY_ID to backend/.env
[ ] Add RAZORPAY_KEY_SECRET to backend/.env
[ ] Import razorpayService functions in server.js
[ ] Add POST /payment/create-order route
[ ] Add POST /payment/verify route
[ ] Add POST /payment/refund route
[ ] Update booking tables schema with payment fields

Frontend:
[ ] Add NEXT_PUBLIC_RAZORPAY_KEY_ID to frontend/.env.local
[ ] Import RazorpayCheckout in BookingConfirmation.js
[ ] Add payment button UI
[ ] Add payment success handler
[ ] Add payment failure handler
[ ] Show Tamil success/error messages

Testing:
[ ] Test with card: 4111 1111 1111 1111
[ ] Verify payment in Razorpay dashboard
[ ] Check booking status updates to 'paid'
[ ] Test refund flow

Please implement each item and mark as complete.
```

---

## 🎯 Use This Prompt:

**Copy and paste this to any AI assistant:**

```
I need to integrate Razorpay payment gateway into my Tamil AI Travel Planner. 

I have these files already created:
- backend/services/razorpayService.js (payment service functions)
- frontend/components/RazorpayCheckout.js (payment UI component)
- backend/RAZORPAY_INTEGRATION.md (integration guide)

Please help me:
1. Add payment routes to backend/server.js using the razorpayService functions
2. Update backend/db.js to add payment_id and payment_status columns to booking tables
3. Update frontend/components/BookingConfirmation.js to use RazorpayCheckout component
4. Add environment variables for Razorpay keys
5. Use Tamil language for all payment messages

Follow the guide in backend/RAZORPAY_INTEGRATION.md and connect the existing service files to the booking flow.
```

---

**Choose the prompt that fits your needs:**
- **Quick**: Use the "Quick Copy-Paste Prompt"
- **Detailed**: Use the "Step-by-Step Prompt"
- **Specific**: Use the individual file update prompts
- **Checklist**: Use the "Checklist Prompt" for tracking progress
