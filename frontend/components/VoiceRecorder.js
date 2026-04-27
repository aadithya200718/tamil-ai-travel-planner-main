import { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * VoiceRecorder component.
 * Uses the browser Web Speech API for direct text transcription if available,
 * and falls back to MediaRecorder to return an audio Blob if not.
 *
 * Props:
 *   onRecorded(blob: Blob) — called when recording stops (fallback)
 *   onTranscript(text: string) — called when speech is natively transcribed
 *   disabled?: boolean
 */
export default function VoiceRecorder({ onRecorded, onTranscript, disabled = false, language = 'ta' }) {
  const { ui } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  
  // Handlers for fallback MediaRecorder
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Handlers for Web Speech API
  const [useWebSpeech, setUseWebSpeech] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Detect Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setUseWebSpeech(true);
      const recognition = new SpeechRecognition();
        recognition.lang = language === 'en' ? 'en-IN' : 'ta-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onTranscript) {
           onTranscript(transcript);
        }
      };
      
      recognition.onerror = (event) => {
         console.error("Speech recognition error", event.error);
         if (event.error !== 'no-speech') {
             setError(ui(`குரல் பிழை: ${event.error}`));
          }
         setIsRecording(false);
      };

      recognition.onend = () => {
         setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language, onTranscript, ui]);

  const startRecording = useCallback(async () => {
    setError('');
    
    if (useWebSpeech && recognitionRef.current) {
        setIsRecording(true);
        try {
            recognitionRef.current.start();
        } catch(e) {
            console.error(e);
            setIsRecording(false);
        }
        return;
    }
    
    // Fallback: MediaRecorder
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecorded(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError(ui('Microphone access denied or not available.'));
    }
  }, [onRecorded, ui, useWebSpeech]);

  const stopRecording = useCallback(() => {
    if (useWebSpeech && recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording, useWebSpeech]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={disabled}
          style={btnStyle('#e74c3c', disabled)}
          title={ui('பேசுங்கள் (Record)')}
        >
          <i className="ri-mic-line" style={{ marginRight: '8px' }}></i>{ui('பேசுங்கள் (Record)')}
        </button>
      ) : (
        <button
          onClick={stopRecording}
          style={btnStyle('#c0392b')}
          title={ui('நிறுத்து (Stop)')}
        >
          <i className="ri-stop-circle-line" style={{ marginRight: '8px' }}></i>{ui('நிறுத்து (Stop)')}
        </button>
      )}
      {isRecording && (
        <span style={{ color: '#e74c3c', fontSize: 13, animation: 'pulse 1s infinite', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="ri-record-circle-fill"></i> {ui('பதிவு நடக்கிறது…')}
        </span>
      )}
      {error && <span style={{ color: '#c0392b', fontSize: 13 }}>{error}</span>}
    </div>
  );
}

function btnStyle(bg, disabled = false) {
  return {
    background: disabled ? '#ccc' : bg,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 24px',
    fontSize: 16,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  };
}
