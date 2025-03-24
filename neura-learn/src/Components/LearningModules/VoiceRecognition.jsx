import React, { useState, useRef } from 'react';
import axios from 'axios';

const VoiceRecognition = () => {
  const [mode, setMode] = useState('speech_accuracy');
  const [target, setTarget] = useState('');
  const [question, setQuestion] = useState('');
  const [practiceText, setPracticeText] = useState('');
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Refs for MediaRecorder and audio chunks
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Start recording with explicit MIME type including opus codec.
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      setError("Error accessing the microphone.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Submit the recorded audio (or practice text) to the backend.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('mode', mode);

    if (mode === 'practice') {
      formData.append('practice_text', practiceText);
    } else {
      formData.append('target', target);
      formData.append('question', question);
      // Create a Blob from recorded chunks using the same MIME type.
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      console.log("Audio Blob size:", audioBlob.size);
      formData.append('audio', audioBlob, 'recording.webm');
    }

    try {
      // Replace the URL with your PC's IP if testing on mobile.
      const response = await axios.post('http://localhost:9000/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
      setError(null);
    } catch (err) {
      console.error("Axios error:", err.response || err);
      setError(err.response ? err.response.data.detail : 'An error occurred');
      setResult(null);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Voice Recognition Analysis</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Mode:
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="speech_accuracy">Speech Accuracy</option>
              <option value="practice">Practice</option>
              <option value="conversation">Conversation</option>
            </select>
          </label>
        </div>

        {mode === 'practice' ? (
          <div>
            <label>
              Practice Text:
              <textarea
                value={practiceText}
                onChange={(e) => setPracticeText(e.target.value)}
                required
              />
            </label>
          </div>
        ) : (
          <>
            <div>
              <label>
                Target Text:
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </label>
            </div>
            {mode === 'conversation' && (
              <div>
                <label>
                  Question:
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                  />
                </label>
              </div>
            )}
            <div style={{ margin: '10px 0' }}>
              <button type="button" onClick={startRecording} disabled={recording}>
                Start Recording
              </button>
              <button type="button" onClick={stopRecording} disabled={!recording}>
                Stop Recording
              </button>
            </div>
          </>
        )}

        <button type="submit">Submit</button>
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: '20px' }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default VoiceRecognition;
