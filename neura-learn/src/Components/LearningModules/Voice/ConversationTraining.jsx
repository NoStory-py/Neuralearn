import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ConversationTraining.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:9000";

// Completion screen with percentage & pass/fail messaging
const CompletionScreen = ({ score, total }) => {
  const pct = total ? Math.round((score / (total * 10)) * 100) : 0;
  let msg;
  if (pct >= 90) msg = "Excellent! 🌟";
  else if (pct >= 75) msg = "Very Good! 🎉";
  else if (pct >= 60) msg = "Good Job! 👍";
  else if (pct >= 40) msg = "Average. Keep Trying! 💪";
  else msg = "Let's Practice More! 😊";

  return (
    <div className="completion-screen">
      <h2>🎉 Congratulations! 🎉</h2>
      <p>Your Score: {pct}%</p>
      <p>{msg}</p>
      {pct >= 40 ? (
        <p>You passed! 🎉</p>
      ) : (
        <p>You can do it—try again! 💪</p>
      )}
      <button
        onClick={() => window.location.reload()}
        className="analyze-btn"
      >
        Start New Session
      </button>
    </div>
  );
};

const ConversationTraining = () => {
  const [sessionId, setSessionId] = useState("");
  const [inputMethod, setInputMethod] = useState("voice");
  const [textResponse, setTextResponse] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [questionSets, setQuestionSets] = useState({});
  const [selectedSet] = useState("main");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);

  const speechSynth = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const selectedVoice = useRef(null);

  const [authToken] = useState(localStorage.getItem("token"));

  // Track attempts per question
  const attemptsRef = useRef({});
  const trackAttempt = () => {
    attemptsRef.current[currentQuestionIndex] =
      (attemptsRef.current[currentQuestionIndex] || 0) + 1;
  };
  const calculateMarks = () => {
    const att = attemptsRef.current[currentQuestionIndex] || 1;
    return Math.max(10 - (att - 1), 0);
  };

  // Clear feedback on question change
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [currentQuestionIndex]);

  // Auto-clear errors
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Load and select voices (with safe cleanup)
  useEffect(() => {
    const synth = speechSynth.current;
    const loadVoices = () => {
      const voices = synth.getVoices();
      const tgt = voices.find((v) => /female|zira|child/i.test(v.name));
      selectedVoice.current = tgt || voices[0] || null;
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

  // Speak helper
  const speakText = (text) => {
    if (!text) return;
    if (speechSynth.current.speaking) speechSynth.current.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    if (selectedVoice.current) ut.voice = selectedVoice.current;
    ut.pitch = 1.8;
    ut.rate = 0.9;
    ut.volume = 1;
    speechSynth.current.speak(ut);
  };

  // On session completion, announce congratulations
  useEffect(() => {
    if (sessionCompleted) {
      speakText("Congratulations!");
    }
  }, [sessionCompleted]);

  // Cleanup media resources
  const cleanupMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };

  // Cancel TTS & cleanup on unload
  useEffect(() => {
    const synth = speechSynth.current;
    const handler = () => {
      if (synth.speaking) synth.cancel();
      cleanupMedia();
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      if (synth.speaking) synth.cancel();
      cleanupMedia();
    };
  }, []);

  // Initialize session ID
  useEffect(() => {
    setSessionId(
      Date.now().toString(36) + Math.random().toString(36).slice(2)
    );
  }, []);

  // Load questions
  useEffect(() => {
    axios
      .get(`${API_BASE}/questions/${selectedSet}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then((res) => {
        setQuestionSets((s) => ({ ...s, [selectedSet]: res.data }));
        if (res.data.length > 0) speakText(res.data[0]);
      })
      .catch(() => {});
  }, [selectedSet, authToken]);

  // Speak when question changes
  useEffect(() => {
    const q = questionSets[selectedSet]?.[currentQuestionIndex];
    if (q) speakText(q);
  }, [currentQuestionIndex, questionSets, selectedSet]);

  // Hover to speak
  const handleHoverSpeak = (text) => {
    if (!speechSynth.current.speaking) speakText(text);
  };

  // Recording handlers
  const startRecording = async () => {
    try {
      cleanupMedia();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaStreamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.start();
      setRecording(true);
    } catch {
      setError("Microphone access required");
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    trackAttempt();

    const formData = new FormData();
    const currQ = questionSets[selectedSet]?.[currentQuestionIndex];
    formData.append("session_id", sessionId);
    formData.append("question", currQ);
    formData.append("mode", "conversation");

    if (inputMethod === "voice") {
      if (!audioChunksRef.current.length) {
        setError("Please record a response");
        return;
      }
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      formData.append("audio", blob, "response.webm");
    } else {
      if (!textResponse.trim()) {
        setError("Please enter a text response");
        return;
      }
      formData.append("text_response", textResponse);
    }

    try {
      const res = await axios.post(`${API_BASE}/analyze`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(res.data);
      cleanupMedia();

      // Emotion-response branch
      if (res.data.emotion_response) {
        const earned = calculateMarks();
        setScore((s) => s + earned);
        speakText(res.data.emotion_response);
        setTimeout(() => {
          const next = currentQuestionIndex + 1;
          if (next < questionSets[selectedSet]?.length) {
            setCurrentQuestionIndex(next);
            setTextResponse("");
            setResult(null);
          } else {
            setSessionCompleted(true);
          }
        }, 2000);
        return;
      }

      // Correct answer branch
      if (res.data.is_correct) {
        const earned = calculateMarks();
        setScore((s) => s + earned);
        const feedback = "Awesome answer! Let's move to the next question";
        const ut = new SpeechSynthesisUtterance(feedback);
        if (selectedVoice.current) ut.voice = selectedVoice.current;
        ut.pitch = 1.8;
        ut.rate = 0.9;
        ut.onend = () => {
          setShowSuccess(false);
          const next = currentQuestionIndex + 1;
          if (next < questionSets[selectedSet]?.length) {
            setCurrentQuestionIndex(next);
            setTextResponse("");
            setResult(null);
          } else {
            setSessionCompleted(true);
          }
        };
        setShowSuccess(true);
        speechSynth.current.speak(ut);
        return;
      }

      // Suggestions branch
      if (res.data.suggestions?.length) {
        speakText(res.data.suggestions.join(". "));
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed");
    }
  };

  const currentQuestion =
    questionSets[selectedSet]?.[currentQuestionIndex];

  return (
    <div className="background-container">
      <div className="whiteboard-container">
        {sessionCompleted ? (
          <CompletionScreen
            score={score}
            total={questionSets[selectedSet]?.length}
          />
        ) : (
          <>
            {/* ... rest of your UI ... */}
            <div className="question-header">
              <span className="score-star">⭐ {score}</span>
              <h2
                className="question-text"
                onMouseEnter={() => handleHoverSpeak(currentQuestion)}
                onMouseLeave={() => speechSynth.current.cancel()}
              >
                {currentQuestion ||
                  "All questions completed! Great job! 🎉"}
              </h2>
              <span className="question-counter">
                {questionSets[selectedSet]?.length >
                currentQuestionIndex
                  ? `Question ${currentQuestionIndex + 1} of ${
                      questionSets[selectedSet]?.length
                    }`
                  : "Completed!"}
              </span>
            </div>

            <div className="input-toggle">
              <button
                type="button"
                className={`toggle-btn ${
                  inputMethod === "voice" ? "active" : ""
                }`}
                onClick={() => setInputMethod("voice")}
              >
                🎤 Voice
              </button>
              <button
                type="button"
                className={`toggle-btn ${
                  inputMethod === "text" ? "active" : ""
                }`}
                onClick={() => setInputMethod("text")}
              >
                ✏️ Text
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {inputMethod === "voice" ? (
                <div className="voice-controls">
                  <button
                    type="button"
                    className={`record-btn ${
                      recording ? "recording" : ""
                    }`}
                    onClick={recording ? stopRecording : startRecording}
                  >
                    {recording
                      ? "⏹ Stop Recording"
                      : "⏺ Start Recording"}
                  </button>
                  <p className="recording-hint">
                    Press and hold to record your answer
                  </p>
                </div>
              ) : (
                <div className="text-input">
                  <textarea
                    value={textResponse}
                    onChange={(e) => setTextResponse(e.target.value)}
                    placeholder="Type your answer here..."
                    rows="3"
                  />
                </div>
              )}

              <button type="submit" className="analyze-btn">
                {showSuccess ? "🎉 Great Job!" : "Check Answer"}
              </button>
            </form>

            {result?.emotion_response ? (
              <div className="feedback-box positive">
                <div className="positive-message">
                  {result.emotion_response}
                </div>
              </div>
            ) : (
              result && (
                <div
                  className={`feedback-box ${
                    result.is_correct ? "positive" : "improvement-needed"
                  }`}
                >
                  {result.is_correct ? (
                    <>
                      <div className="positive-message">
                        🌟 Awesome answer! Let's move to the next question
                      </div>
                      <div className="encouragement">
                        Next question loading...
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="improvement-message">
                        💡 Let's Try Again
                      </div>
                      {result.suggestions.map((sug, i) => (
                        <div
                          key={i}
                          className="suggestion"
                          onMouseEnter={() => handleHoverSpeak(sug)}
                          onMouseLeave={() =>
                            speechSynth.current.cancel()
                          }
                        >
                          {sug}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )
            )}

            {error && <div className="error-box">{error}</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationTraining;
