import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ConversationTraining.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:9000";

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
  const speechSynth = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const selectedVoice = useRef(null);
  const mediaStreamRef = useRef(null);

  // Cleanup media resources
  const cleanupMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };

  useEffect(() => {
    const synth = speechSynth.current; // Capture current value in local variable
    const handleBeforeUnload = () => {
      if (synth.speaking) {
        synth.cancel();
      }
      cleanupMedia();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Use the captured value in cleanup
      if (synth.speaking) {
        synth.cancel();
      }
      cleanupMedia();
    };
  }, []);

  useEffect(() => {
    const newSessionId =
      Date.now().toString(36) + Math.random().toString(36).substr(2);
    setSessionId(newSessionId);
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const speakText = (text) => {
    if (!text) return;
    if (speechSynth.current.speaking) {
      speechSynth.current.cancel();
    }

    utteranceRef.current = new SpeechSynthesisUtterance(text);
    if (selectedVoice.current) {
      utteranceRef.current.voice = selectedVoice.current;
    }

    utteranceRef.current.pitch = 1.8;
    utteranceRef.current.rate = 0.9;
    utteranceRef.current.volume = 1;

    speechSynth.current.speak(utteranceRef.current);
  };

  const handleHoverSpeak = (text) => {
    if (!speechSynth.current.speaking) {
      speakText(text);
    }
  };

  useEffect(() => {
    axios
      .get(`${API_BASE}/questions/${selectedSet}`)
      .then((res) => {
        setQuestionSets((s) => ({ ...s, [selectedSet]: res.data }));
        if (res.data.length > 0) {
          setTimeout(() => speakText(res.data[0]), 500);
        }
      })
      .catch((err) => console.error("Error loading questions:", err));
  }, [selectedSet]);

  useEffect(() => {
    if (questionSets[selectedSet]?.[currentQuestionIndex]) {
      speakText(questionSets[selectedSet][currentQuestionIndex]);
    }
  }, [currentQuestionIndex, questionSets, selectedSet]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (speechSynth.current.speaking) {
        speechSynth.current.cancel();
      }
      cleanupMedia();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const startRecording = async () => {
    try {
      cleanupMedia(); // Clean up previous recordings
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = []; // Reset chunks array

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      setError("Microphone access required");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    const currentQuestion = questionSets[selectedSet]?.[currentQuestionIndex];

    formData.append("session_id", sessionId);
    formData.append("question", currentQuestion);
    formData.append("mode", "conversation");

    if (inputMethod === "voice") {
      if (audioChunksRef.current.length === 0) {
        setError("Please record a response");
        return;
      }
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      formData.append("audio", audioBlob, "response.webm");
    } else {
      if (!textResponse.trim()) {
        setError("Please enter a text response");
        return;
      }
      formData.append("text_response", textResponse);
    }

    try {
      const response = await axios.post(`${API_BASE}/analyze`, formData);
      setResult(response.data);

      // Reset media resources after successful submission
      cleanupMedia();
      audioChunksRef.current = [];

      if (response.data.emotion_response) {
        speakText(response.data.emotion_response);
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => {
            if (prev + 1 >= questionSets[selectedSet]?.length) {
              setSessionCompleted(true);
              return prev;
            }
            return prev + 1;
          });
          setTextResponse("");
          setResult(null);
        }, 2000);
      } else if (response.data.is_correct) {
        speakText("Awesome answer! Let's move to the next question.");
        utteranceRef.current.onend = () => {
          setScore((s) => s + 10);
          setShowSuccess(true);
          setTimeout(() => {
            setCurrentQuestionIndex((prev) => {
              if (prev + 1 >= questionSets[selectedSet]?.length) {
                setSessionCompleted(true);
                return prev;
              }
              return prev + 1;
            });
            setShowSuccess(false);
            setTextResponse("");
          }, 500);
        };
      } else if (response.data.suggestions?.length > 0) {
        speakText(response.data.suggestions.join(". "));
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed");
    }
  };

  const currentQuestion = questionSets[selectedSet]?.[currentQuestionIndex];

  return (
    <div className="background-container">
      <div className="whiteboard-container">
        {sessionCompleted ? (
          <div className="completion-screen">
            <h2>All done! 🎉 Final Score: ⭐{score}</h2>
            <button
              onClick={() => window.location.reload()}
              className="analyze-btn"
            >
              Start New Session
            </button>
          </div>
        ) : (
          <>
            <div className="question-header">
              <span className="score-star">⭐ {score}</span>
              <h2
                className="question-text"
                onMouseEnter={() => handleHoverSpeak(currentQuestion)}
                onMouseLeave={() => speechSynth.current.cancel()}
              >
                {currentQuestion || "All questions completed! Great job! 🎉"}
              </h2>
              <span className="question-counter">
                {questionSets[selectedSet]?.length > currentQuestionIndex
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
                    className={`record-btn ${recording ? "recording" : ""}`}
                    onClick={recording ? stopRecording : startRecording}
                  >
                    {recording ? "⏹ Stop Recording" : "⏺ Start Recording"}
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
                      <div className="positive-message">🌟 Awesome Answer!</div>
                      <div className="encouragement">
                        Next question loading...
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="improvement-message">
                        💡 Let's Try Again
                      </div>
                      {result.suggestions.map((suggestion, i) => (
                        <div
                          key={i}
                          className="suggestion"
                          onMouseEnter={() => handleHoverSpeak(suggestion)}
                          onMouseLeave={() => speechSynth.current.cancel()}
                        >
                          {suggestion}
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
