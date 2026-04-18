/**
 * razorpayService.js
 * Razorpay payment gateway integration for Tamil AI Travel Planner
 * 
 * Setup:
 * 1. Sign up at https://razorpay.com/
 * 2. Get API keys from Dashboard > Settings > API Keys
 * 3. Add to .env:
 *    RAZORPAY_KEY_ID=rzp_test_xxxxx
 *    RAZORPAY_KEY_SECRET=xxxxx
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxxxx',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'xxxxx',
});

/**
 * Create a Razorpay order for booking payment
 * @param {Object} bookingDetails - Booking information
 * @returns {Promise<Object>} Razorpay order details
 */
async function createPaymentOrder(bookingDetails) {
  const { bookingId, totalPrice, customerName, customerEmail, customerPhone } = bookingDetails;

  try {
    const options = {
      amount: totalPrice * 100, // Amount in paise (₹1000 = 100000 paise)
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: {
        booking_id: bookingId,
        customer_name: customerName,
        customer_email: customerEmail || '',
        customer_phone: customerPhone,
      },
    };

    const order = await razorpay.orders.create(options);

    console.log(`[Razorpay] Order created: ${order.id} for ₹${totalPrice}`);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    };
  } catch (error) {
    console.error('[Razorpay] Order creation failed:', error);
    if (error?.statusCode === 401) {
      throw new Error('Razorpay API key அல்லது secret தவறாக உள்ளது. backend/.env அமைப்பை சரிபார்க்கவும்.');
    }
    throw new Error('பணம் செலுத்தும் ஆர்டரை உருவாக்க முடியவில்லை');
  }
}

/**
 * Verify Razorpay payment signature
 * @param {Object} paymentDetails - Payment verification details
 * @returns {boolean} True if signature is valid
 */
function verifyPaymentSignature(paymentDetails) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;

  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    if (isValid) {
      console.log(`[Razorpay] Payment verified: ${razorpay_payment_id}`);
    } else {
      console.warn(`[Razorpay] Invalid signature for payment: ${razorpay_payment_id}`);
    }

    return isValid;
  } catch (error) {
    console.error('[Razorpay] Signature verification failed:', error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
async function getPaymentDetails(paymentId) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      id: payment.id,
      amount: payment.amount / 100, // Convert paise to rupees
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      createdAt: new Date(payment.created_at * 1000),
    };
  } catch (error) {
    console.error('[Razorpay] Failed to fetch payment:', error);
    throw new Error('பணம் செலுத்தும் விவரங்களை பெற முடியவில்லை');
  }
}

/**
 * Initiate refund for a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Refund amount in rupees (optional, full refund if not provided)
 * @returns {Promise<Object>} Refund details
 */
async function initiateRefund(paymentId, amount = null) {
  try {
    const refundOptions = {};
    if (amount) {
      refundOptions.amount = amount * 100; // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    console.log(`[Razorpay] Refund initiated: ${refund.id} for ₹${refund.amount / 100}`);

    return {
      refundId: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100,
      currency: refund.currency,
      status: refund.status,
      createdAt: new Date(refund.created_at * 1000),
    };
  } catch (error) {
    console.error('[Razorpay] Refund failed:', error);
    throw new Error('பணத்தை திரும்பப் பெற முடியவில்லை');
  }
}

/**
 * Check refund status
 * @param {string} refundId - Razorpay refund ID
 * @returns {Promise<Object>} Refund status
 */
async function getRefundStatus(refundId) {
  try {
    const refund = await razorpay.refunds.fetch(refundId);
    return {
      id: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      createdAt: new Date(refund.created_at * 1000),
    };
  } catch (error) {
    console.error('[Razorpay] Failed to fetch refund status:', error);
    throw new Error('திரும்பப் பெறும் நிலையை பெற முடியவில்லை');
  }
}

module.exports = {
  createPaymentOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  initiateRefund,
  getRefundStatus,
};
