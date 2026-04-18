import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import VoiceRecorder from '../components/VoiceRecorder';
import ItineraryDisplay from '../components/ItineraryDisplay';
import { sendQuery, sendVoice, fetchRecent } from '../services/api';

export default function Home() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [mode, setMode] = useState('bus');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const [elderlyMode, setElderlyMode] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const name = localStorage.getItem('userName');
    if (token && name) {
      setUser({ name, token });
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setUser(null);
    router.push('/');
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('elderlyMode');
      if (stored === 'true') setElderlyMode(true);
    } catch (_) {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('elderlyMode', elderlyMode ? 'true' : 'false');
    } catch (_) {
      // localStorage unavailable
    }
  }, [elderlyMode]);

  useEffect(() => {
    fetchRecent()
      .then((data) => setRecent(data))
      .catch(() => {});
  }, []);

  async function handleTextSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await sendQuery(text.trim(), mode);
      setResult(data);
      setRecent((prev) => [data, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVoiceTranscript(transcript) {
    if (!transcript) return;

    setText(transcript);
    setLoading(true);
    setError('');

    try {
      const data = await sendQuery(transcript, mode);
      setResult(data);
      setRecent((prev) => [data, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVoiceRecorded(blob) {
    setLoading(true);
    setError('');

    try {
      const data = await sendVoice(blob, mode);
      setResult(data);
      if (data.transcript) setText(data.transcript);
      setRecent((prev) => [data, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>தமிழ் AI பயண திட்டமிடுபவர்</title>
        <meta
          name="description"
          content="குரல் மற்றும் உரை அடிப்படையில் செயல்படும் தமிழ் பயண திட்டமிடுபவர்"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={elderlyMode ? 'elderly-mode' : ''} style={containerStyle}>
        <div style={headerStyle}>
          <div style={authHeaderStyle}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14 }}>
                  வணக்கம், <b>{user.name}</b>
                </span>
                <button onClick={handleLogout} style={authBtnStyle}>
                  வெளியேறு
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => router.push('/login')} style={authBtnStyle}>
                  உள்நுழைக
                </button>
                <button
                  onClick={() => router.push('/register')}
                  style={{ ...authBtnStyle, background: '#fff', color: '#667eea' }}
                >
                  புதிய கணக்கு
                </button>
              </div>
            )}
          </div>

          <div style={titleBlockStyle}>
            <h1 style={{ margin: 0, fontSize: 28 }}>தமிழ் AI பயண திட்டமிடுபவர்</h1>
            <p style={titleSubStyle}>
              உங்கள் பயண திட்டங்களை உரை அல்லது குரல் மூலம் தொடங்குங்கள்
            </p>
          </div>

          <button
            onClick={() => setElderlyMode((value) => !value)}
            style={elderlyToggleStyle}
            title={elderlyMode ? 'சாதாரண எழுத்துக்கு மாறவும்' : 'பெரிய எழுத்துக்கு மாறவும்'}
          >
            <i className={elderlyMode ? 'ri-font-size' : 'ri-text'} style={{ marginRight: '8px' }}></i>
            {elderlyMode ? 'சாதாரண எழுத்து' : 'பெரிய எழுத்து'}
          </button>
        </div>

        <main style={mainStyle}>
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <i className="ri-chat-voice-line" style={{ marginRight: '8px' }}></i>
              உங்கள் பயணத்தை திட்டமிடுங்கள்
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <button type="button" onClick={() => setMode('bus')} style={tabBtnStyle(mode === 'bus')}>
                <i className="ri-bus-fill" style={{ fontSize: 20, marginBottom: 4 }}></i>
                <div>பேருந்து</div>
              </button>
              <button type="button" onClick={() => setMode('train')} style={tabBtnStyle(mode === 'train')}>
                <i className="ri-train-fill" style={{ fontSize: 20, marginBottom: 4 }}></i>
                <div>ரயில்</div>
              </button>
              <button type="button" onClick={() => setMode('flight')} style={tabBtnStyle(mode === 'flight')}>
                <i className="ri-flight-takeoff-line" style={{ fontSize: 20, marginBottom: 4 }}></i>
                <div>விமானம்</div>
              </button>
              <button type="button" onClick={() => setMode('hotel')} style={tabBtnStyle(mode === 'hotel')}>
                <i className="ri-hotel-fill" style={{ fontSize: 20, marginBottom: 4 }}></i>
                <div>தங்கும் விடுதி</div>
              </button>
            </div>

            <form onSubmit={handleTextSubmit} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="எ.கா: Chennai இருந்து Madurai பயண திட்டம் தேவை"
                  style={inputStyle}
                  disabled={loading}
                />
                <button
                  type="submit"
                  style={primaryBtnStyle(loading)}
                  disabled={loading || !text.trim()}
                >
                  {loading ? (
                    'செயலாக்கம்…'
                  ) : (
                    <>
                      <i className="ri-search-line" style={{ marginRight: '4px' }}></i> தேடு
                    </>
                  )}
                </button>
              </div>
            </form>

            <div style={{ textAlign: 'center', margin: '12px 0', color: '#999', fontSize: 13 }}>
              — அல்லது குரல் மூலம் —
            </div>

            <VoiceRecorder
              onRecorded={handleVoiceRecorded}
              onTranscript={handleVoiceTranscript}
              disabled={loading}
            />

            {error && (
              <div style={errorStyle}>
                <i className="ri-error-warning-line" style={{ marginRight: '8px' }}></i>
                {error}
              </div>
            )}
          </section>

          {loading && (
            <div
              style={{
                textAlign: 'center',
                padding: 32,
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <i
                className="ri-loader-4-line"
                style={{ animation: 'spin 1.5s linear infinite', fontSize: 20 }}
              ></i>
              திட்டம் தயாராகிறது…
            </div>
          )}

          {!loading && result && <ItineraryDisplay result={result} />}

          {recent.length > 0 && (
            <section className="recent-section" style={{ ...sectionStyle, marginTop: 24 }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowRecent((value) => !value)}
              >
                <h2 style={{ ...sectionTitleStyle, margin: 0 }}>
                  <i className="ri-history-line" style={{ marginRight: '8px' }}></i>
                  சமீபத்திய தேடல்கள்
                </h2>
                <span style={{ fontSize: 14, color: '#2887ff' }}>
                  <i
                    className={showRecent ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
                    style={{ marginRight: '4px' }}
                  ></i>
                  {showRecent ? 'மறை' : 'காட்டு'}
                </span>
              </div>

              {showRecent && (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
                  {recent.map((item, index) => (
                    <li
                      key={item.queryId || index}
                      style={recentItemStyle}
                      onClick={() => setResult(item)}
                    >
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {item.entities?.source && item.entities?.destination
                          ? `${item.entities.source} → ${item.entities.destination}`
                          : item.transcript}
                      </span>
                      <span style={{ fontSize: 12, color: '#777', marginLeft: 8 }}>
                        [{item.intent}]
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </main>
      </div>
    </>
  );
}

const containerStyle = {
  minHeight: '100vh',
  background: '#f3f4f6',
  fontFamily: "'DM Sans', 'Noto Sans Tamil', Arial, sans-serif",
  color: '#0a0a0a',
};

const headerStyle = {
  background: '#2887ff',
  color: '#ffffff',
  textAlign: 'center',
  padding: '28px 20px 20px',
  position: 'relative',
};

const authHeaderStyle = {
  position: 'absolute',
  top: 16,
  left: 16,
};

const authBtnStyle = {
  background: 'transparent',
  color: '#ffffff',
  border: '1px solid rgba(255,255,255,0.6)',
  borderRadius: '5rem',
  padding: '6px 12px',
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 0.3s',
  fontFamily: 'inherit',
};

const titleBlockStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 12,
  marginTop: 20,
};

const titleSubStyle = {
  margin: 0,
  fontSize: 14,
  opacity: 0.92,
};

const elderlyToggleStyle = {
  position: 'absolute',
  top: 16,
  right: 16,
  background: 'rgba(255,255,255,0.2)',
  color: '#ffffff',
  border: '1px solid rgba(255,255,255,0.6)',
  borderRadius: '5rem',
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'inherit',
  transition: 'background 0.3s',
};

const mainStyle = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '24px 16px 40px',
};

const sectionStyle = {
  background: '#ffffff',
  borderRadius: 12,
  boxShadow: '5px 5px 20px rgba(0, 0, 0, 0.1)',
  padding: 24,
};

const sectionTitleStyle = {
  fontSize: 17,
  color: '#2c3e50',
  marginBottom: 16,
  marginTop: 0,
};

const inputStyle = {
  flex: 1,
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: 15,
  outline: 'none',
  fontFamily: 'inherit',
};

function primaryBtnStyle(disabled) {
  return {
    background: disabled ? '#aaa' : '#2887ff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5rem',
    padding: '12px 20px',
    fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    transition: '0.3s',
  };
}

function tabBtnStyle(active) {
  return {
    background: active ? 'rgba(40,135,255, 0.1)' : '#f9fafb',
    border: active ? '1px solid #2887ff' : '1px solid #e5e7eb',
    color: active ? '#2887ff' : '#6b7280',
    borderRadius: 8,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    fontWeight: active ? 600 : 500,
    fontSize: 13,
  };
}

const errorStyle = {
  marginTop: 12,
  padding: '10px 14px',
  background: '#fde8e8',
  border: '1px solid #f5c6c6',
  borderRadius: 8,
  color: '#c0392b',
  fontSize: 14,
};

const recentItemStyle = {
  padding: '10px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  marginBottom: 6,
  background: '#f8f9fa',
  border: '1px solid #eee',
  transition: 'background 0.2s',
};
