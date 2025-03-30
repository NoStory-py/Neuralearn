import React, { useState } from 'react';
import axios from 'axios';
import './VoiceRecognition.css';

const EmotionPractice = () => {
  const [practiceText, setPracticeText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('mode', 'practice');
    formData.append('practice_text', practiceText);
    
    try {
      const response = await axios.post('http://localhost:9000/analyze', formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed');
    }
  };

  return (
    <div className="voice-container">
      <form onSubmit={handleSubmit}>
        <div className="target-section">
          <textarea
            className="target-input"
            placeholder="How are you feeling today?"
            value={practiceText}
            onChange={(e) => setPracticeText(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="record-button analysis-button">
          Analyze Emotion
        </button>
      </form>

      {/* Optionally display results or errors */}
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

export default EmotionPractice;
