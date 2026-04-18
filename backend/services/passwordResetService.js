const axios = require('axios');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
const DEFAULT_COUNTRY_CODE = process.env.TWILIO_DEFAULT_COUNTRY_CODE || '+91';

function assertTwilioConfig() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    throw new Error('Twilio OTP அமைப்புக்கு TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID தேவை');
  }
}

function normalizePhoneNumber(phone) {
  const raw = String(phone || '').trim();
  if (!raw) {
    throw new Error('OTP அனுப்ப பதிவு செய்யப்பட்ட தொலைபேசி எண் இல்லை');
  }

  if (raw.startsWith('+')) {
    const normalized = `+${raw.slice(1).replace(/\D/g, '')}`;
    if (normalized.length < 11) {
      throw new Error('OTP அனுப்ப சரியான தொலைபேசி எண் தேவை');
    }
    return normalized;
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${DEFAULT_COUNTRY_CODE}${digits}`;
  }
  if (digits.length >= 11) {
    return `+${digits}`;
  }

  throw new Error('OTP அனுப்ப சரியான தொலைபேசி எண் தேவை');
}

function maskPhoneNumber(phone) {
  const normalized = normalizePhoneNumber(phone);
  const visible = normalized.slice(-4);
  return `${'*'.repeat(Math.max(0, normalized.length - 4))}${visible}`;
}

async function sendPasswordResetOtp(phone) {
  assertTwilioConfig();
  const normalizedPhone = normalizePhoneNumber(phone);
  const params = new URLSearchParams({
    To: normalizedPhone,
    Channel: 'sms',
  });

  await axios.post(
    `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
    params.toString(),
    {
      auth: {
        username: TWILIO_ACCOUNT_SID,
        password: TWILIO_AUTH_TOKEN,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    }
  );

  return {
    phone: normalizedPhone,
    maskedPhone: maskPhoneNumber(normalizedPhone),
  };
}

async function verifyPasswordResetOtp(phone, code) {
  assertTwilioConfig();
  const normalizedPhone = normalizePhoneNumber(phone);
  const params = new URLSearchParams({
    To: normalizedPhone,
    Code: code,
  });

  const response = await axios.post(
    `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
    params.toString(),
    {
      auth: {
        username: TWILIO_ACCOUNT_SID,
        password: TWILIO_AUTH_TOKEN,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    }
  );

  return response.data.status === 'approved' || response.data.valid === true;
}

module.exports = {
  normalizePhoneNumber,
  maskPhoneNumber,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
};
