import React, { useState, useRef } from 'react';
import axios from 'axios';
import './VoiceRecognition.css';

const SpeechTraining = () => {
  const [target, setTarget] = useState('');
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError("Microphone access required");
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (audioChunksRef.current.length === 0) {
      setError("No audio recorded. Please record your speech.");
      return;
    }
    const formData = new FormData();
    formData.append('mode', 'speech_accuracy');
    formData.append('target', target);

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const response = await axios.post('http://localhost:9000/analyze', formData);
      setResult(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed');
    }
  };

  return (
    <div className="voice-container">
      <form onSubmit={handleSubmit}>
        <div className="target-section">
          <input
            type="text"
            className="target-input"
            placeholder="Enter target phrase..."
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />
        </div>

        <div className="recording-controls">
          <button
            type="button"
            className={`record-button ${recording ? 'recording' : ''}`}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>

        <button type="submit" className="record-button analysis-button">
          Analyze Speech
        </button>
      </form>

      {result && (
        <div className="results-container">
          <h3>Analysis Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {error && (
        <div className="error-message">
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default SpeechTraining;
