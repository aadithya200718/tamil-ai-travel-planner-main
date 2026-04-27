import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { registerUser } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const router = useRouter();
  const { ui } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1 = personal info, 2 = password

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  function handleNext(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('உங்கள் பெயரை உள்ளிடவும்');
      return;
    }
    if (!form.email.trim()) {
      setError('மின்னஞ்சலை உள்ளிடவும்');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('சரியான மின்னஞ்சலை உள்ளிடவும்');
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.password) {
      setError('கடவுச்சொல்லை உள்ளிடவும்');
      return;
    }
    if (form.password.length < 6) {
      setError('கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('கடவுச்சொற்கள் பொருந்தவில்லை');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
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

  const passwordStrength = getPasswordStrength(form.password);

  return (
    <>
      <Head>
        <title>{ui('புதிய கணக்கு')} - {ui('தமிழ் AI பயண திட்டமிடுபவர்')}</title>
        <meta name="description" content={ui('தமிழ் AI பயண திட்டமிடுபவரில் புதிய கணக்கு உருவாக்குங்கள்')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={pageStyle}>
        {/* Animated background orbs */}
        <div style={orb1Style}></div>
        <div style={orb2Style}></div>
        <div style={orb3Style}></div>

        <div style={cardContainerStyle}>
          {/* Brand */}
          <div style={brandStyle}>
            <h1 style={brandTitleStyle}>{ui('தமிழ் AI பயண திட்டமிடுபவர்')}</h1>
            <p style={brandSubStyle}>{ui('உங்கள் கணக்கை உருவாக்கி பயண திட்டங்களை தொடங்குங்கள்')}</p>
          </div>

          {/* Register Card */}
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>{ui('புதிய கணக்கு உருவாக்கு')}</h2>
            <p style={cardDescStyle}>{ui('உங்கள் பயணத்தை இன்றே தொடங்குங்கள்')}</p>

            {/* Step Indicator */}
            <div style={stepIndicatorStyle}>
              <div style={stepDotStyle(step >= 1, true)}>
                <span style={stepNumStyle}>1</span>
              </div>
              <div style={stepLineStyle(step >= 2)}></div>
              <div style={stepDotStyle(step >= 2, step === 2)}>
                <span style={stepNumStyle}>2</span>
              </div>
            </div>
            <div style={stepLabelsStyle}>
              <span style={stepLabelStyle(step >= 1)}>{ui('தனிப்பட்ட தகவல்')}</span>
              <span style={stepLabelStyle(step >= 2)}>{ui('கடவுச்சொல்')}</span>
            </div>

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <form onSubmit={handleNext} style={{ marginTop: 20 }}>
                {/* Name */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}><i className="ri-user-line" style={{ marginRight: '8px' }}></i>{ui('பெயர்')}</label>
                  <input
                    id="register-name"
                    type="text"
                    value={form.name}
                    onChange={e => updateField('name', e.target.value)}
                    placeholder={ui('உங்கள் முழுப் பெயர்')}
                    style={inputStyle}
                    autoComplete="name"
                    autoFocus
                  />
                </div>

                {/* Email */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}><i className="ri-mail-line" style={{ marginRight: '8px' }}></i>{ui('மின்னஞ்சல்')}</label>
                  <input
                    id="register-email"
                    type="email"
                    value={form.email}
                    onChange={e => updateField('email', e.target.value)}
                    placeholder={ui('உதாரணம்@email.com')}
                    style={inputStyle}
                    autoComplete="email"
                  />
                </div>

                {/* Phone */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}><i className="ri-phone-line" style={{ marginRight: '8px' }}></i>{ui('தொலைபேசி')} <span style={{ color: '#737373', fontSize: 12, fontWeight: 400 }}>{ui('(விருப்பம்)')}</span></label>
                  <input
                    id="register-phone"
                    type="tel"
                    value={form.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    style={inputStyle}
                    autoComplete="tel"
                  />
                  <div style={{ fontSize: 12, color: '#737373', marginTop: 6 }}>
                    {ui('கடவுச்சொல் மறந்தால் OTP அனுப்ப இந்த எண் பயன்படும்')}
                  </div>
                </div>

                {error && <div style={errorStyle}><i className="ri-error-warning-line" style={{ marginRight: '8px' }}></i>{ui(error)}</div>}

                <button id="register-next" type="submit" style={submitBtnStyle(false)}>
                  {ui('அடுத்து')} →
                </button>
              </form>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
                {/* Summary */}
                <div style={summaryBoxStyle}>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{ui('பதிவு செய்யப்படுகிறது:')}</div>
                  <div style={{ fontSize: 15, color: '#fff', fontWeight: 600 }}>{form.name}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{form.email}</div>
                </div>

                {/* Password */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}><i className="ri-lock-line" style={{ marginRight: '8px' }}></i>{ui('கடவுச்சொல்')}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => updateField('password', e.target.value)}
                        placeholder={ui('குறைந்தது 6 எழுத்துகள்')}
                      style={{ ...inputStyle, paddingRight: 48 }}
                      autoComplete="new-password"
                      autoFocus
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={eyeBtnStyle}
                      tabIndex={-1}
                    >
                      <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} style={{ color: '#0a0a0a' }}></i>
                    </button>
                  </div>
                  {/* Password strength bar */}
                  {form.password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={strengthBarBgStyle}>
                        <div style={strengthBarFillStyle(passwordStrength)}></div>
                      </div>
                      <div style={{ fontSize: 12, color: strengthColor(passwordStrength), marginTop: 4 }}>
                        {ui(strengthLabel(passwordStrength))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}><i className="ri-lock-password-line" style={{ marginRight: '8px' }}></i>{ui('கடவுச்சொல் உறுதிப்படுத்தல்')}</label>
                  <input
                    id="register-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => updateField('confirmPassword', e.target.value)}
                    placeholder={ui('கடவுச்சொல்லை மீண்டும் உள்ளிடவும்')}
                    style={inputStyle}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>
                      <i className="ri-close-circle-line" style={{ marginRight: '4px' }}></i>{ui('கடவுச்சொற்கள் பொருந்தவில்லை')}
                    </div>
                  )}
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <div style={{ fontSize: 12, color: '#2ecc71', marginTop: 4 }}>
                      <i className="ri-checkbox-circle-line" style={{ marginRight: '4px' }}></i>{ui('கடவுச்சொற்கள் பொருந்துகின்றன')}
                    </div>
                  )}
                </div>

                {error && <div style={errorStyle}><i className="ri-error-warning-line" style={{ marginRight: '8px' }}></i>{ui(error)}</div>}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    style={backBtnStyle}
                    disabled={loading}
                  >
                    <i className="ri-arrow-left-line" style={{ marginRight: '8px' }}></i>{ui('பின்')}
                  </button>
                  <button
                    id="register-submit"
                    type="submit"
                    style={{ ...submitBtnStyle(loading), flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={spinnerStyle}></span>
                        {ui('பதிவு செய்கிறது…')}
                      </span>
                    ) : (
                      <>
                        <i className="ri-user-add-line" style={{ marginRight: '8px' }}></i>
                        {ui('கணக்கு உருவாக்கு')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Login link */}
            <div style={linkSectionStyle}>
              <p style={{ margin: 0, color: '#8e99a4', fontSize: 14 }}>
                {ui('ஏற்கனவே கணக்கு உள்ளதா?')}{' '}
                <a
                  href="/login"
                  onClick={e => { e.preventDefault(); router.push('/login'); }}
                  style={linkStyle}
                >
                  {ui('உள்நுழைக')} →
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
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

// ─── Helper functions ────────────────────────────────────────────────────────

function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

function strengthColor(s) {
  return ['#ff4757', '#ff6b6b', '#ffa502', '#2ed573', '#2ecc71'][s] || '#666';
}

function strengthLabel(s) {
  return ['மிகவும் பலவீனம்', 'பலவீனம்', 'சுமார்', 'நல்லது', 'மிகவும் நல்லது'][s] || '';
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  top: '40%',
  left: '70%',
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
  marginBottom: 24,
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

const stepIndicatorStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 24,
  gap: 0,
};

function stepDotStyle(active, current) {
  return {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: active ? '#2887ff' : '#ddd',
    border: current ? '2px solid rgba(40,135,255,0.4)' : '2px solid transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: active ? '0 4px 12px rgba(40,135,255, 0.3)' : 'none',
  };
}

const stepNumStyle = {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 700,
};

function stepLineStyle(active) {
  return {
    width: 60,
    height: 2,
    background: active ? '#2887ff' : '#ddd',
    transition: 'all 0.3s ease',
  };
}

const stepLabelsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: 48,
  marginTop: 8,
};

function stepLabelStyle(active) {
  return {
    fontSize: 11,
    color: active ? '#0a0a0a' : '#737373',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.3s ease',
  };
}

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

const summaryBoxStyle = {
  background: 'rgba(40,135,255, 0.1)',
  border: '1px solid rgba(40,135,255, 0.2)',
  borderRadius: 12,
  padding: '12px 16px',
  marginBottom: 20,
};

const strengthBarBgStyle = {
  width: '100%',
  height: 4,
  borderRadius: 4,
  background: '#ddd',
  overflow: 'hidden',
};

function strengthBarFillStyle(strength) {
  const widths = ['20%', '40%', '60%', '80%', '100%'];
  const colors = ['#ff4757', '#ff6b6b', '#ffa502', '#2ed573', '#2ecc71'];
  return {
    width: widths[strength] || '0%',
    height: '100%',
    borderRadius: 4,
    background: colors[strength] || '#666',
    transition: 'all 0.3s ease',
  };
}

const errorStyle = {
  marginBottom: 16,
  padding: '12px 16px',
  background: '#fde8e8',
  border: '1px solid #f5c6c6',
  borderRadius: '5rem',
  color: '#c0392b',
  fontSize: 14,
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
  };
}

const backBtnStyle = {
  padding: '16px 20px',
  borderRadius: '5rem',
  border: '1px solid #ddd',
  background: '#ffffff',
  color: '#0a0a0a',
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.3s ease',
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
