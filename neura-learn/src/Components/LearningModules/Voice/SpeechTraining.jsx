import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import "./SpeechTraining.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:9000";

const SpeechTraining = () => {
  const [currentWord, setCurrentWord] = useState("");
  const [words, setWords] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [showWord, setShowWord] = useState(false);
  const [phase, setPhase] = useState("start");
  const [level, setLevel] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [inputMethod, setInputMethod] = useState("mic");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechSynth = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const selectedVoice = useRef(null);
  const currentIndexRef = useRef(currentIndex);
  const attemptsRef = useRef({ level1: {}, level2: {} });

  // Keep ref in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Show result briefly
  useEffect(() => {
    if (result) {
      setShowResult(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        setResult(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  // Load and set up voices
  useEffect(() => {
    const synth = speechSynth.current;
    const loadVoices = () => {
      const voices = synth.getVoices();
      const target = voices.find((v) => /female|zira|child/i.test(v.name));
      selectedVoice.current = target || voices[0] || null;
      utteranceRef.current = new SpeechSynthesisUtterance();
      if (selectedVoice.current) {
        utteranceRef.current.voice = selectedVoice.current;
        utteranceRef.current.pitch = 1.8;
        utteranceRef.current.rate = 0.9;
      }
    };

    synth.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  // Fetch words & init session ID
  useEffect(() => {
    const sid =
      Date.now().toString(36) + Math.random().toString(36).slice(2);
    setSessionId(sid);

    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE}/api/speech-training/words`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setWords(res.data.words))
      .catch((err) => console.error("Error loading words:", err));
  }, []);

  // Start level 2 after delay
  const showNext = useCallback(() => {
    const pool = level === 1 ? words : sentences;
    const text = pool[currentIndexRef.current];
    setCurrentWord(text);
    setShowWord(true);
    setPhase("showingWord");

    utteranceRef.current.onend = () => {
      setShowWord(false);
      setPhase("responding");
      speak("Please repeat what I said");
      utteranceRef.current.onend = null;
    };

    if (speechSynth.current.speaking) {
      speechSynth.current.cancel();
    }
    utteranceRef.current.text = text;
    speechSynth.current.speak(utteranceRef.current);
  }, [level, sentences, words]);

  useEffect(() => {
    if (level === 2 && sentences.length > 0) {
      const timer = setTimeout(() => showNext(), 1000);
      return () => clearTimeout(timer);
    }
  }, [level, sentences, showNext]);

  const regenerateSentences = () => {
    if (words.length === 7) {
      return [
        `my name is ${words[0]}`,
        `i am a ${words[1]}`,
        `i am ${words[2]} years old`,
        `my favorite color is ${words[3]}`,
        `i like to eat ${words[4]}`,
        `my favorite animal is a ${words[5]}`,
        `i like ${words[6]}`,
      ];
    }
    return [];
  };

  const speak = (text) => {
    if (!speechSynth.current || !utteranceRef.current) return;
    if (speechSynth.current.speaking) {
      speechSynth.current.cancel();
    }
    utteranceRef.current.text = text;
    speechSynth.current.speak(utteranceRef.current);
  };

  const startTraining = () => {
    if (!words.length) return;
    setLevel(1);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setSentences([]);
    setPhase("start");
    speak("Start Level 1");
    showNext();
  };

  const trackAttempt = () => {
    const currentLevelKey = level === 1 ? "level1" : "level2";
    const idx = currentIndexRef.current;
    attemptsRef.current[currentLevelKey][idx] =
      (attemptsRef.current[currentLevelKey][idx] || 0) + 1;
  };

  const calculateMarks = () => {
    const lvlKey = level === 1 ? "level1" : "level2";
    const idx = currentIndexRef.current;
    const attempts = attemptsRef.current[lvlKey][idx] || 1;
    return Math.max(10 - (attempts - 1), 0);
  };

  const calculateFinalScore = () => {
    let total = 0;
    const totalQs = words.length + sentences.length;
    ["level1", "level2"].forEach((lk) => {
      Object.values(attemptsRef.current[lk]).forEach((a) => {
        total += Math.max(10 - (a - 1), 0);
      });
    });
    const pct = (total / (totalQs * 10)) * 100;
    setFinalScore(pct);
    setSessionCompleted(true);
    speak(
      `Congratulations! You completed both levels with ${pct.toFixed(
        1
      )}% score`
    );
  };

  const handleSubmit = async (textResponse) => {
    try {
      trackAttempt();
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("session_id", sessionId);
      form.append("mode", "speech_training");
      form.append("question", currentWord);

      if (inputMethod === "mic") {
        if (!audioBlob) {
          setError("No recording to submit");
          return;
        }
        form.append("audio", audioBlob, "response.webm");
      } else {
        form.append("text_response", textResponse || "");
      }

      const res = await axios.post(`${API_BASE}/analyze`, form, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });

      setResult(res.data);
      setAudioBlob(null);

      if (res.data.is_correct) {
        const marks = calculateMarks();
        setScore((s) => s + marks);
        speak("Awesome answer!");

        const poolLen = level === 1 ? words.length : sentences.length;
        if (currentIndexRef.current + 1 < poolLen) {
          setCurrentIndex((i) => {
            const next = i + 1;
            currentIndexRef.current = next;
            return next;
          });
          setTimeout(showNext, level === 1 ? 2000 : 3000);
        } else if (level === 1) {
          speak("Congratulations, you completed level 1");
          setTimeout(() => {
            setLevel(2);
            setCurrentIndex(0);
            currentIndexRef.current = 0;
            setSentences(regenerateSentences());
            speak("Start Level 2");
          }, 3000);
        } else {
          calculateFinalScore();
        }
      } else {
        speak(
          res.data.is_echolalia
            ? "Repeat the displayed word"
            : "Let's try again"
        );
        setTimeout(showNext, 2000);
      }

      if (inputMethod === "text") setTextInput("");
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed");
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mr = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.start();
      setRecording(true);
    } catch {
      setError("Microphone access required");
    }
  };

  const stopRecording = () =>
    new Promise((resolve) => {
      mediaRecorderRef.current.addEventListener(
        "stop",
        () => {
          const blob = new Blob(audioChunksRef.current, {
            type: "audio/webm;codecs=opus",
          });
          setAudioBlob(blob);
          resolve();
        },
        { once: true }
      );
      mediaRecorderRef.current.stop();
      setRecording(false);
    });

  const CompletionScreen = () => {
    const getMessage = () => {
      if (finalScore >= 90) return "Excellent! 🌟";
      if (finalScore >= 75) return "Very Good! 🎉";
      if (finalScore >= 60) return "Good Job! 👍";
      if (finalScore >= 40) return "Average. Keep Trying! 💪";
      return "Let's Practice More! 😊";
    };

    return (
      <div className="completion-screen-speech">
        <div className="completion-content">
          <h2>Congratulations! 🎉</h2>
          <p>You've completed both levels!</p>
          <div className="score-summary">
            <p>Final Score: {finalScore.toFixed(1)}%</p>
            <p>{getMessage()}</p>
            {finalScore >= 40 ? (
              <p>Well done! You passed! 🎉</p>
            ) : (
              <p>Keep practicing! You can do it! 💪</p>
            )}
          </div>
        </div>
        <div className="completion-footer">
          <button
            onClick={() => window.location.reload()}
            className="play-again-button"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="speech-training-container">
      <div
        className="background-image"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/Images/child-smiling.png)`,
        }}
      >
        {showWord && level === 1 && (
          <>
            <div className="eye-word-wrapper left-eye">
              <div className="eye-word">{currentWord}</div>
            </div>
            <div className="eye-word-wrapper right-eye">
              <div className="eye-word">{currentWord}</div>
            </div>
          </>
        )}
        {showWord && level === 2 && (
          <div className="center-word-wrapper">
            <div className="center-word">{currentWord}</div>
          </div>
        )}
      </div>

      {sessionCompleted ? (
        <CompletionScreen />
      ) : (
        <>
          {phase === "start" && (
            <button className="start-button" onClick={startTraining}>
              Start Level 1
            </button>
          )}

          {phase === "responding" && (
            <div className="response-panel">
              <div className="input-toggle">
                <button
                  className={`toggle-btn ${inputMethod === "mic" ? "active" : ""}`}
                  onClick={() => setInputMethod("mic")}
                >
                  🎤 Microphone
                </button>
                <button
                  className={`toggle-btn ${inputMethod === "text" ? "active" : ""}`}
                  onClick={() => setInputMethod("text")}
                >
                  ✏️ Text
                </button>
              </div>

              {inputMethod === "mic" ? (
                <div className="recording-controls">
                  <button
                    className={`record-btn ${recording ? "recording" : ""}`}
                    onClick={recording ? stopRecording : startRecording}
                  >
                    {recording ? "⏹ Stop" : "⏺ Record"}
                  </button>
                  {audioBlob && (
                    <div className="audio-review">
                      <p>Ready: {Math.round(audioBlob.size / 1024)} KB</p>
                      <button className="submit-btn" onClick={() => handleSubmit()}>
                        Submit
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-input-group">
                  <textarea
                    className="response-textarea"
                    placeholder="Type what you heard..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSubmit(textInput)}
                  />
                  <button
                    className="submit-btn"
                    onClick={() => handleSubmit(textInput)}
                    disabled={!textInput.trim()}
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showResult && (
        <div className="result-panel">
          <div className="score">Score: ⭐{score}</div>
          <div className="relevance">
            Confidence: {Math.round(result.confidence * 100)}%
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default SpeechTraining;
