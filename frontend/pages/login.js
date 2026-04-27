import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  loginUser,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
} from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const router = useRouter();
  const { ui } = useLanguage();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [resetForm, setResetForm] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  }

  function updateResetField(field, value) {
    setResetForm((prev) => ({ ...prev, [field]: value }));
    setResetError('');
    setResetSuccess('');
    setSuccess('');
  }

  function toggleForgotPassword() {
    setForgotOpen((prev) => !prev);
    setResetError('');
    setResetSuccess('');
    setMaskedPhone('');
    setOtpSent(false);
    setResetForm((prev) => ({
      email: prev.email || form.email,
      code: '',
      newPassword: '',
      confirmPassword: '',
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('அனைத்து புலங்களையும் நிரப்பவும்');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await loginUser({ email: form.email, password: form.password });
      localStorage.setItem('authToken', data.user.token);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);
      router.push('/planner');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    const email = resetForm.email.trim();
    if (!email) {
      setResetError('OTP அனுப்ப மின்னஞ்சலை உள்ளிடவும்');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const data = await sendForgotPasswordOtp({ email });
      setOtpSent(true);
      setMaskedPhone(data.maskedPhone || '');
      setResetSuccess(data.message || 'OTP அனுப்பப்பட்டது');
      setForm((prev) => ({ ...prev, email }));
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  }

  async function handlePasswordReset(e) {
    e.preventDefault();

    const email = resetForm.email.trim();
    const code = resetForm.code.trim();
    const newPassword = resetForm.newPassword;
    const confirmPassword = resetForm.confirmPassword;

    if (!email || !code || !newPassword || !confirmPassword) {
      setResetError('அனைத்து மீட்பு புலங்களையும் நிரப்பவும்');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('புதிய கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('புதிய கடவுச்சொற்கள் பொருந்தவில்லை');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const data = await resetPasswordWithOtp({ email, code, newPassword });
      setSuccess(data.message || 'கடவுச்சொல் மாற்றப்பட்டது');
      setForgotOpen(false);
      setOtpSent(false);
      setMaskedPhone('');
      setForm((prev) => ({ ...prev, email, password: '' }));
      setResetForm({
        email,
        code: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{ui('உள்நுழைவு')} - {ui('தமிழ் AI பயண திட்டமிடுபவர்')}</title>
        <meta
          name="description"
          content={ui('தமிழ் AI பயண திட்டமிடுபவரில் உள்நுழைக')}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={pageStyle}>
        <div style={orb1Style}></div>
        <div style={orb2Style}></div>
        <div style={orb3Style}></div>

        <div style={cardContainerStyle}>
          <div style={brandStyle}>
            <h1 style={brandTitleStyle}>{ui('தமிழ் AI பயண திட்டமிடுபவர்')}</h1>
            <p style={brandSubStyle}>{ui('பாதுகாப்பாக உள்நுழைந்து உங்கள் பயணங்களை தொடருங்கள்')}</p>
          </div>

          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>{ui('உள்நுழைவு')}</h2>
            <p style={cardDescStyle}>{ui('உங்கள் கணக்கில் உள்நுழையுங்கள்')}</p>

            <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  <i className="ri-mail-line" style={{ marginRight: '8px' }}></i>
                  {ui('மின்னஞ்சல்')}
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={ui('உதாரணம்@email.com')}
                  style={inputStyle}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  <i className="ri-lock-line" style={{ marginRight: '8px' }}></i>
                  {ui('கடவுச்சொல்')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                      placeholder={ui('குறைந்தது 6 எழுத்துகள்')}
                    style={{ ...inputStyle, paddingRight: 48 }}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    style={eyeBtnStyle}
                    tabIndex={-1}
                  >
                    <i
                      className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}
                      style={{ color: '#0a0a0a' }}
                    ></i>
                  </button>
                </div>
              </div>

              <div style={helperRowStyle}>
                <button
                  type="button"
                  onClick={toggleForgotPassword}
                  style={textButtonStyle}
                >
                  {ui('கடவுச்சொல்லை மறந்துவிட்டீர்களா?')}
                </button>
              </div>

              {success && (
                <div style={successStyle}>
                  <i className="ri-checkbox-circle-line" style={{ marginRight: '8px' }}></i>
                  {ui(success)}
                </div>
              )}

              {error && (
                <div style={errorStyle}>
                  <i className="ri-error-warning-line" style={{ marginRight: '8px' }}></i>
                  {ui(error)}
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                style={submitBtnStyle(loading)}
                disabled={loading}
              >
                {loading ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={spinnerStyle}></span>
                    {ui('உள்நுழைகிறது…')}
                  </span>
                ) : (
                  <>
                    <i className="ri-login-circle-line" style={{ marginRight: '8px' }}></i>
                    {ui('உள்நுழைக')}
                  </>
                )}
              </button>
            </form>

            {forgotOpen && (
              <div style={forgotCardStyle}>
                <div style={forgotHeaderStyle}>
                  <h3 style={forgotTitleStyle}>{ui('OTP மூலம் கடவுச்சொல் மாற்றம்')}</h3>
                  <p style={forgotDescStyle}>
                    {ui('பதிவு செய்யப்பட்ட தொலைபேசி எண்ணுக்கு Twilio மூலம் OTP அனுப்பப்படும்.')}
                  </p>
                </div>

                <form onSubmit={handlePasswordReset}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>
                      <i className="ri-mail-line" style={{ marginRight: '8px' }}></i>
                      {ui('மின்னஞ்சல்')}
                    </label>
                    <input
                      type="email"
                      value={resetForm.email}
                      onChange={(e) => updateResetField('email', e.target.value)}
                        placeholder={ui('உங்கள் பதிவு செய்யப்பட்ட மின்னஞ்சல்')}
                      style={inputStyle}
                      autoComplete="email"
                      disabled={resetLoading}
                    />
                  </div>

                  <div style={forgotActionRowStyle}>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      style={secondaryBtnStyle(resetLoading)}
                      disabled={resetLoading}
                    >
                      {resetLoading && !otpSent ? ui('OTP அனுப்புகிறது…') : ui('OTP அனுப்பு')}
                    </button>
                    {maskedPhone && <span style={noteStyle}>{ui('அனுப்பிய எண்:')} {maskedPhone}</span>}
                  </div>

                  {resetSuccess && (
                    <div style={successStyle}>
                      <i className="ri-checkbox-circle-line" style={{ marginRight: '8px' }}></i>
                      {ui(resetSuccess)}
                    </div>
                  )}

                  {resetError && (
                    <div style={errorStyle}>
                      <i className="ri-error-warning-line" style={{ marginRight: '8px' }}></i>
                      {ui(resetError)}
                    </div>
                  )}

                  {otpSent && (
                    <>
                      <div style={fieldGroupStyle}>
                        <label style={labelStyle}>
                          <i className="ri-shield-keyhole-line" style={{ marginRight: '8px' }}></i>
                          OTP
                        </label>
                        <input
                          type="text"
                          value={resetForm.code}
                          onChange={(e) => updateResetField('code', e.target.value)}
                          placeholder="6 இலக்க OTP"
                          style={inputStyle}
                          autoComplete="one-time-code"
                          disabled={resetLoading}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelStyle}>
                          <i className="ri-lock-password-line" style={{ marginRight: '8px' }}></i>
                          {ui('புதிய கடவுச்சொல்')}
                        </label>
                        <input
                          type="password"
                          value={resetForm.newPassword}
                          onChange={(e) => updateResetField('newPassword', e.target.value)}
                          placeholder={ui('புதிய கடவுச்சொல்')}
                          style={inputStyle}
                          autoComplete="new-password"
                          disabled={resetLoading}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelStyle}>
                          <i className="ri-lock-password-line" style={{ marginRight: '8px' }}></i>
                          {ui('புதிய கடவுச்சொல் உறுதிப்படுத்தல்')}
                        </label>
                        <input
                          type="password"
                          value={resetForm.confirmPassword}
                          onChange={(e) => updateResetField('confirmPassword', e.target.value)}
                          placeholder={ui('புதிய கடவுச்சொல்லை மீண்டும் உள்ளிடவும்')}
                          style={inputStyle}
                          autoComplete="new-password"
                          disabled={resetLoading}
                        />
                      </div>

                      <button
                        type="submit"
                        style={submitBtnStyle(resetLoading)}
                        disabled={resetLoading}
                      >
                        {resetLoading ? ui('கடவுச்சொல் மாற்றுகிறது…') : ui('கடவுச்சொல்லை மாற்று')}
                      </button>
                    </>
                  )}
                </form>
              </div>
            )}

            <div style={linkSectionStyle}>
              <p style={{ margin: 0, color: '#8e99a4', fontSize: 14 }}>
                {ui('கணக்கு இல்லையா?')}{' '}
                <a
                  href="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/register');
                  }}
                  style={linkStyle}
                >
                  {ui('புதிய கணக்கு உருவாக்கு')} →
                </a>
              </p>
            </div>
          </div>

          <p style={footerStyle}>
            © 2026 {ui('தமிழ் AI பயண திட்டமிடுபவர்')}
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.1); }
          66% { transform: translate(25px, -40px) scale(0.9); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 30px) scale(1.08); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15) !important;
          outline: none;
        }
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4) !important;
        }
      `}</style>
    </>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'DM Sans', 'Noto Sans Tamil', sans-serif",
  padding: '20px',
  position: 'relative',
  overflow: 'hidden',
};

const orb1Style = {
  position: 'absolute',
  width: 400,
  height: 400,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(40,135,255,0.15) 0%, transparent 70%)',
  top: '-10%',
  left: '-5%',
  animation: 'float1 12s ease-in-out infinite',
  pointerEvents: 'none',
};

const orb2Style = {
  position: 'absolute',
  width: 350,
  height: 350,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(40,135,255,0.1) 0%, transparent 70%)',
  bottom: '-8%',
  right: '-3%',
  animation: 'float2 15s ease-in-out infinite',
  pointerEvents: 'none',
};

const orb3Style = {
  position: 'absolute',
  width: 200,
  height: 200,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(40,135,255,0.05) 0%, transparent 70%)',
  top: '50%',
  left: '60%',
  animation: 'float3 10s ease-in-out infinite',
  pointerEvents: 'none',
};

const cardContainerStyle = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 440,
  animation: 'fadeInUp 0.6s ease-out',
};

const brandStyle = {
  textAlign: 'center',
  marginBottom: 28,
};

const brandTitleStyle = {
  color: '#0a0a0a',
  fontSize: 22,
  fontWeight: 700,
  margin: 0,
  letterSpacing: '0.5px',
};

const brandSubStyle = {
  color: '#737373',
  fontSize: 13,
  marginTop: 8,
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  borderRadius: 20,
  padding: '36px 32px 28px',
  boxShadow: '5px 5px 20px rgba(0, 0, 0, 0.1)',
};

const cardTitleStyle = {
  color: '#0a0a0a',
  fontSize: 24,
  fontWeight: 700,
  margin: 0,
  textAlign: 'center',
};

const cardDescStyle = {
  color: '#737373',
  fontSize: 14,
  textAlign: 'center',
  marginTop: 6,
  marginBottom: 0,
};

const fieldGroupStyle = {
  marginBottom: 20,
};

const labelStyle = {
  display: 'block',
  color: '#0a0a0a',
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '5rem',
  border: '1px solid #ddd',
  background: '#ffffff',
  color: '#0a0a0a',
  fontSize: 15,
  fontFamily: 'inherit',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
};

const eyeBtnStyle = {
  position: 'absolute',
  right: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 18,
  padding: 4,
};

const helperRowStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: -4,
  marginBottom: 16,
};

const textButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#2887ff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  padding: 0,
};

const forgotCardStyle = {
  marginTop: 20,
  padding: '20px 18px',
  borderRadius: 16,
  background: 'rgba(40,135,255,0.06)',
  border: '1px solid rgba(40,135,255,0.12)',
};

const forgotHeaderStyle = {
  marginBottom: 16,
};

const forgotTitleStyle = {
  margin: 0,
  color: '#0a0a0a',
  fontSize: 18,
  fontWeight: 700,
};

const forgotDescStyle = {
  margin: '6px 0 0',
  color: '#5f6b76',
  fontSize: 13,
  lineHeight: 1.5,
};

const forgotActionRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
  flexWrap: 'wrap',
};

function submitBtnStyle(loading) {
  return {
    width: '100%',
    padding: '16px',
    borderRadius: '5rem',
    border: 'none',
    background: loading ? '#aaa' : '#2887ff',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    marginTop: 4,
  };
}

function secondaryBtnStyle(loading) {
  return {
    padding: '12px 18px',
    borderRadius: '5rem',
    border: '1px solid #2887ff',
    background: loading ? '#dbeafe' : '#ffffff',
    color: '#2887ff',
    fontSize: 14,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
  };
}

const noteStyle = {
  color: '#4b5563',
  fontSize: 13,
  fontWeight: 500,
};

const errorStyle = {
  marginBottom: 16,
  padding: '12px 16px',
  background: '#fde8e8',
  border: '1px solid #f5c6c6',
  borderRadius: '5rem',
  color: '#c0392b',
  fontSize: 14,
};

const successStyle = {
  marginBottom: 16,
  padding: '12px 16px',
  background: '#e7f8ee',
  border: '1px solid #b7e4c7',
  borderRadius: '5rem',
  color: '#1e7a46',
  fontSize: 14,
};

const spinnerStyle = {
  display: 'inline-block',
  width: 18,
  height: 18,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 0.6s linear infinite',
};

const linkSectionStyle = {
  textAlign: 'center',
  marginTop: 24,
  paddingTop: 20,
  borderTop: '1px solid rgba(255,255,255,0.08)',
};

const linkStyle = {
  color: '#2887ff',
  textDecoration: 'none',
  fontWeight: 600,
  transition: 'color 0.2s',
};

const footerStyle = {
  textAlign: 'center',
  color: '#737373',
  fontSize: 12,
  marginTop: 24,
};
