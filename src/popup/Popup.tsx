import React, { useState } from 'react';
import './Popup.css';

const Popup: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioUrl) {
         URL.revokeObjectURL(audioUrl);
      }
      const objectUrl = URL.createObjectURL(file);
      setAudioUrl(objectUrl);
      setAudioFile(file);
      setStatus(`File selected: ${file.name}`);
      setTranscribedText('');
      setError(null);
    }
  };

  const translateAudio = async () => {
    if (!audioFile) {
      setError('No audio file selected.');
      return;
    }

    setStatus('Translating audio...');
    setError(null);
    setTranscribedText('');

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050';
      const backendRes = await fetch(`${backendUrl}/api/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (!backendRes.ok) {
        const errText = await backendRes.text();
        throw new Error(`Backend error: ${errText}`);
      }

      const result = await backendRes.json();
      setStatus('Transcription complete.');
      setTranscribedText(result.text);
    } catch (err: any) {
      setError(err.message);
      setStatus('');
    }
  };

  const tryParse = async () => {
    setStatus('Mapping text to form fields...');
    try {
      chrome.runtime.sendMessage({ action: 'PARSE_FIELDS', text: transcribedText }, (res: any) => {
        if (!res?.success) {
           setError(res?.error || 'Failed to parse text');
           setStatus('');
        } else {
            setStatus('Success! Fields populated.');
        }
      });
    } catch (err: any) {
      setError(err.message);
      setStatus('');
    }
  };

  return (
    <div className="popup-container">
      <header>
        <h2>PatientVoiceFiller</h2>
        <p>Speak in Marathi/Hindi to auto-fill medical forms.</p>
      </header>

      <div className="controls">
        <label className="btn primary" style={{ display: 'inline-block', cursor: 'pointer', textAlign: 'center' }}>
          Upload Voice Memo
          <input 
            type="file" 
            accept=".flac,.mp3,.mp4,.mpeg,.mpga,.m4a,.ogg,.wav,.webm" 
            onChange={handleFileChange} 
            style={{ display: 'none' }}
          />
        </label>

        {audioUrl && (
          <div style={{ marginTop: '15px' }}>
            <audio src={audioUrl} controls style={{ width: '100%', marginBottom: '10px' }} />
            <button className="btn primary" onClick={translateAudio}>
              Translate Audio
            </button>
          </div>
        )}

        {transcribedText && (
          <button className="btn secondary" onClick={tryParse} style={{marginLeft: '10px', marginTop: '10px'}}>
            Try Parse
          </button>
        )}
      </div>

      {transcribedText && (
        <div className="transcript-container" style={{marginTop: '15px', border: '1px solid #ccc', borderRadius: '4px', padding: '8px'}}>
          <strong style={{ display: 'block', marginBottom: '8px', textAlign: 'left' }}>Transcription:</strong>
          <textarea 
             className="transcript-box" 
             value={transcribedText}
             onChange={(e) => setTranscribedText(e.target.value)}
             style={{width: '100%', height: '80px', padding: '4px', boxSizing: 'border-box'}}
          />
        </div>
      )}

      <div className="status-area">
        {status && <p className="status-text">{status}</p>}
        {error && <p className="error-text">Error: {error}</p>}
      </div>
    </div>
  );
};

export default Popup;
