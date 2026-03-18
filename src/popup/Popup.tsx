import React, { useState } from 'react';
import './Popup.css';

const Popup: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const startRecording = async () => {
    setError(null);
    setStatus('Recording... Speak your symptoms clearly.');
    setIsRecording(true);
    
    try {
      // Request mic permission fully in the interactive Popup so Chrome can ask the user safely
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop it immediately since the offscreen doc handles the actual recording
      stream.getTracks().forEach(track => track.stop());
    } catch (err: any) {
      setError('Microphone access denied. Please click the extension icon and allow microphone permissions.');
      setIsRecording(false);
      setStatus('');
      return;
    }
    
    try {
      chrome.runtime.sendMessage({ action: 'START_RECORDING' }, (res: any) => {
        if (!res?.success) {
           setError(res?.error || 'Failed to start recording');
           setIsRecording(false);
           setStatus('');
        }
      });
    } catch (err: any) {
      setError(err.message);
      setIsRecording(false);
      setStatus('');
    }
  };

  const stopAndProcess = async () => {
    setStatus('Processing audio and mapping fields...');
    setIsRecording(false);
    
    try {
      chrome.runtime.sendMessage({ action: 'STOP_AND_PROCESS' }, (res: any) => {
        if (!res?.success) {
           setError(res?.error || 'Failed to process audio');
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
        {!isRecording ? (
          <button className="btn primary" onClick={startRecording}>
            Start Recording
          </button>
        ) : (
          <button className="btn danger" onClick={stopAndProcess}>
            Stop & Process
          </button>
        )}
      </div>

      <div className="status-area">
        {status && <p className="status-text">{status}</p>}
        {error && <p className="error-text">Error: {error}</p>}
      </div>
    </div>
  );
};

export default Popup;
