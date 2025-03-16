import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VoiceRecognition = () => {
  const [mode, setMode] = useState('speech_accuracy');
  const [targetPhrase, setTargetPhrase] = useState('');
  const [question, setQuestion] = useState('');
  const [practiceText, setPracticeText] = useState('');
  const [recording, setRecording] = useState(false);
  const [results, setResults] = useState('');
  const [timer, setTimer] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // Timer effect for recording
  useEffect(() => {
    let interval = null;
    if (recording) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [recording]);

  // Handle mode change
  const handleModeChange = (e) => {
    setMode(e.target.value);
    setResults('');
    // Reset inputs if needed
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' });
      recorder.ondataavailable = (e) => {
        setAudioChunks((prev) => [...prev, e.data]);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setTimer(0);
    } catch (error) {
      setResults('Error: Microphone access denied!');
    }
  };

  // Stop recording and process the audio
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      mediaRecorder.onstop = processRecording;
    }
  };

  // Process the recorded audio and send to Flask backend
  const processRecording = async () => {
    const blob = new Blob(audioChunks, { type: 'audio/webm; codecs=opus' });
    setAudioChunks([]); // Reset for next recording
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    formData.append('mode', mode);
    if (mode === 'speech_accuracy') {
      formData.append('target', targetPhrase);
    } else if (mode === 'conversation') {
      formData.append('question', question);
    }
    try {
      const response = await axios.post('http://localhost:5000/analyze', formData);
      setResults(formatResults(response.data));
    } catch (error) {
      setResults('Analysis failed: ' + error.message);
    }
  };

  // Handle submission for Practice mode (text-based)
  const submitPractice = async () => {
    const formData = new FormData();
    formData.append('mode', 'practice');
    formData.append('practice_text', practiceText);
    try {
      const response = await axios.post('http://localhost:5000/analyze', formData);
      setResults(formatResults(response.data));
    } catch (error) {
      setResults('Practice analysis failed: ' + error.message);
    }
  };

  // Format results received from the backend
  const formatResults = (data) => {
    let output = '';
    if (data.accuracy !== undefined) {
      output += `Accuracy: ${data.accuracy}%\n`;
      output += `Emotion: ${data.emotion} (${(data.confidence * 100).toFixed(1)}%)\n`;
    }
    if (data.relevance) {
      output += `Relevance: ${data.relevance} (${(data.confidence * 100).toFixed(1)}%)\n`;
      output += `Response Time: ${data.response_time}s\n`;
    }
    if (data.audio_features) {
      output += `Duration: ${data.audio_features.duration.toFixed(2)}s\n`;
      output += `Pitch Mean: ${data.audio_features.pitch_mean.toFixed(2)}\n`;
      output += `Pitch Variation: ${data.audio_features.pitch_std.toFixed(2)}\n`;
    }
    if (data.suggestions && data.suggestions.length > 0) {
      output += "\nSuggestions:\n";
      data.suggestions.forEach(s => {
        output += `- ${s}\n`;
      });
    }
    return output;
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <h1>Speech Therapy Tool</h1>
      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <label>
          <input type="radio" name="mode" value="speech_accuracy" checked={mode === 'speech_accuracy'} onChange={handleModeChange} />
          Speech Accuracy
        </label>
        <label style={{ marginLeft: '10px' }}>
          <input type="radio" name="mode" value="conversation" checked={mode === 'conversation'} onChange={handleModeChange} />
          Conversation
        </label>
        <label style={{ marginLeft: '10px' }}>
          <input type="radio" name="mode" value="practice" checked={mode === 'practice'} onChange={handleModeChange} />
          Practice Mode
        </label>
      </div>

      {mode === 'speech_accuracy' && (
        <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Speech Accuracy Test</h3>
          <input
            type="text"
            value={targetPhrase}
            onChange={(e) => setTargetPhrase(e.target.value)}
            placeholder="Enter target phrase"
            style={{ width: '300px' }}
          />
        </div>
      )}

      {mode === 'conversation' && (
        <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Conversation Test</h3>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter question"
            style={{ width: '300px' }}
          />
        </div>
      )}

      {mode === 'practice' && (
        <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Practice Mode</h3>
          <input
            type="text"
            value={practiceText}
            onChange={(e) => setPracticeText(e.target.value)}
            placeholder="Enter your practice phrase"
            style={{ width: '300px' }}
          />
          <button
            onClick={submitPractice}
            style={{
              marginLeft: '10px',
              padding: '10px 20px',
              cursor: 'pointer',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none'
            }}
          >
            Submit Practice
          </button>
        </div>
      )}

      {mode !== 'practice' && (
        <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <button
            onClick={recording ? stopRecording : startRecording}
            style={{
              padding: '10px 20px',
              margin: '5px',
              cursor: 'pointer',
              backgroundColor: recording ? '#ff4444' : '#4CAF50',
              color: 'white',
              border: 'none'
            }}
          >
            {recording ? 'Stop Recording' : 'Start Recording'}
          </button>
          {recording && <div>Recording Time: {timer}s</div>}
        </div>
      )}

      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Results</h3>
        <pre>{results}</pre>
      </div>
    </div>
  );
};

export default VoiceRecognition;
