import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./SpeechTraining.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:9000";

const SpeechTraining = () => {
  const [currentWord, setCurrentWord] = useState('');
  const [words, setWords] = useState([]);
  const [showWord, setShowWord] = useState(false);
  const [phase, setPhase] = useState('start');
  const [score, setScore] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [inputMethod, setInputMethod] = useState('mic');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechSynth = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const selectedVoice = useRef(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynth.current.getVoices();
      const targetVoice = voices.find(voice => 
        voice.name.includes("Female") ||
        voice.name.includes("Zira") || 
        voice.name.includes("Child")
      );
      
      utteranceRef.current = new SpeechSynthesisUtterance();
      selectedVoice.current = targetVoice || voices[0];
      
      if (selectedVoice.current) {
        utteranceRef.current.voice = selectedVoice.current;
        utteranceRef.current.pitch = 1.8;
        utteranceRef.current.rate = 0.9;
      }
    };

    speechSynth.current.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      speechSynth.current.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    const newSessionId =
      Date.now().toString(36) + Math.random().toString(36).substr(2);
    setSessionId(newSessionId);
    
    axios.get(`${API_BASE}/api/speech-training/words`)
      .then(res => setWords(res.data.words))
      .catch(err => console.error("Error loading words:", err));
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const speak = (text) => {
    if (!speechSynth.current || !utteranceRef.current) return;
    
    if (speechSynth.current.speaking) {
      speechSynth.current.cancel();
    }
    
    utteranceRef.current.text = text;
    speechSynth.current.speak(utteranceRef.current);
  };

  const startTraining = () => {
    if (words.length === 0) return;
    
    setPhase('showingWord');
    const newWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(newWord);
    setShowWord(true);
    speak(newWord);

    setTimeout(() => {
      setShowWord(false);
      setPhase('responding');
      speak("Please repeat what I said");
    }, 2000);
  };

  const handleSubmit = async (response) => {
    try {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("mode", "speech_training");
      formData.append("question", currentWord);

      if (inputMethod === "mic") {
        if (!audioBlob) {
          setError("No recording to submit");
          return;
        }
        formData.append("audio", audioBlob, "response.webm");
      } else {
        formData.append("text_response", response);
      }

      const res = await axios.post(`${API_BASE}/analyze`, formData);
      setResult(res.data);
      setAudioBlob(null);

      if (res.data.is_correct) {
        setScore(s => s + 10);
        speak("Awesome! Next word...");
        setTimeout(startTraining, 2000);
      } else if (res.data.is_echolalia) {
        speak("Repeat the displayed word");
        setTimeout(() => {
          speak(currentWord);
          setPhase('responding');
        }, 2000);
      } else {
        speak("Let's try again");
        setTimeout(() => {
          setShowWord(true);
          speak(currentWord);
          setTimeout(() => setShowWord(false), 2000);
        }, 2000);
      }
      
      if (inputMethod === 'text') setTextInput("");
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed");
    }
  };

  const handleTextSubmit = () => {
    const cleanInput = textInput.replace(/[^\w\s]/gi, '').trim();
    if (cleanInput) {
      handleSubmit(cleanInput);
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: false,
          autoGainControl: true,
          noiseSuppression: true
        }
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      setError("Microphone access required");
    }
  };

  const stopRecording = () => {
    return new Promise(resolve => {
      mediaRecorderRef.current.addEventListener('stop', () => {
        const blob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        setAudioBlob(blob);
        resolve();
      }, { once: true });
      
      mediaRecorderRef.current.stop();
      setRecording(false);
    });
  };

  return (
    <div className="speech-training-container">
      <div 
        className="background-image"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/Images/child-smiling.png)` }}
      >
        {showWord && (
          <>
            <div className="eye-word left-eye">{currentWord}</div>
            <div className="eye-word right-eye">{currentWord}</div>
          </>
        )}
      </div>

      {phase === 'start' && (
        <button className="start-button" onClick={startTraining}>
          Start Training
        </button>
      )}

      {phase === 'responding' && (
        <div className="response-panel">
          <div className="input-toggle">
            <button
              className={`toggle-btn ${inputMethod === 'mic' ? 'active' : ''}`}
              onClick={() => setInputMethod('mic')}
            >
              🎤 Use Microphone
            </button>
            <button
              className={`toggle-btn ${inputMethod === 'text' ? 'active' : ''}`}
              onClick={() => setInputMethod('text')}
            >
              ✏️ Type Response
            </button>
          </div>

          {inputMethod === 'mic' ? (
            <div className="recording-controls">
              <button
                className={`record-btn ${recording ? 'recording' : ''}`}
                onClick={recording ? stopRecording : startRecording}
              >
                {recording ? '⏹ Stop Recording' : '⏺ Start Recording'}
              </button>
              
              {audioBlob && (
                <div className="audio-review">
                  <p>Recording ready! ({Math.round(audioBlob.size/1024)}KB)</p>
                  <button
                    className="submit-btn"
                    onClick={() => handleSubmit()}
                  >
                    ✅ Submit
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-input-group">
              <textarea
                className="response-textarea"
                placeholder="Type the word you heard..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              />
              <button
                className="submit-btn"
                onClick={handleTextSubmit}
                disabled={!textInput.trim()}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="result-panel">
          <div className="score">Score: ⭐{score}</div>
          <div className="relevance">
            Match Confidence: {Math.round(result.confidence * 100)}%
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default SpeechTraining;