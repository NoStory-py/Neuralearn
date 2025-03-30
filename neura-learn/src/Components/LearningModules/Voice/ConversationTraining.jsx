import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ConversationTraining.css";

const ConversationTraining = () => {
  const [sessionId, setSessionId] = useState("");
  const [inputMethod, setInputMethod] = useState("voice");
  const [textResponse, setTextResponse] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [questionSets, setQuestionSets] = useState({});
  const [selectedSet, setSelectedSet] = useState("basic");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechSynth = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const selectedVoice = useRef(null);

  // Voice selection useEffect
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynth.current.getVoices();
      const targetVoice = voices.find((voice) => {
        const isFemale = 
          voice.name.includes("Female") ||
          voice.name.includes("Zira") ||
          voice.name.includes("Child");
        const isChildlike = 
          voice.name.includes("Child") || voice.lang === "en-US";
        return isFemale && isChildlike;
      });
      selectedVoice.current = targetVoice || voices[0];
    };

    speechSynth.current.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      speechSynth.current.onvoiceschanged = null;
    };
  }, []);

  // Text-to-speech functions
  const speakText = (text) => {
    if (!text) return;
    if (speechSynth.current.speaking) {
      speechSynth.current.cancel();
    }
    
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    
    if (selectedVoice.current) {
      utteranceRef.current.voice = selectedVoice.current;
    }

    // Childlike voice adjustments
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

  // Session ID and initial question setup
  useEffect(() => {
    const newSessionId = 
      Date.now().toString(36) + Math.random().toString(36).substr(2);
    setSessionId(newSessionId);
  }, []);

  // Question loading and auto-speak
  useEffect(() => {
    axios.get(`http://localhost:9000/questions/${selectedSet}`)
      .then((res) => {
        setQuestionSets((s) => ({ ...s, [selectedSet]: res.data }));
        if (res.data.length > 0) {
          // Speak first question after short delay to allow voice load
          setTimeout(() => speakText(res.data[0]), 500);
        }
      })
      .catch((err) => console.error("Error loading questions:", err));
  }, [selectedSet]);

  // Speak current question when changed
  useEffect(() => {
    if (questionSets[selectedSet]?.[currentQuestionIndex]) {
      speakText(questionSets[selectedSet][currentQuestionIndex]);
    }
  }, [currentQuestionIndex, questionSets, selectedSet]);

  // Cleanup speech on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (speechSynth.current.speaking) {
        speechSynth.current.cancel();
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      handleError("Microphone access required");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleError = (message) => {
    setError(message);
    setScore((s) => Math.max(0, s - 1));
  };

  // Form submission
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
        handleError("Please record a response");
        return;
      }
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      formData.append("audio", audioBlob, "response.webm");
    } else {
      if (!textResponse.trim()) {
        handleError("Please enter a text response");
        return;
      }
      formData.append("text_response", textResponse);
    }

    try {
      const response = await axios.post(
        "http://localhost:9000/analyze",
        formData
      );
      setResult(response.data);

      const isSuccess =
        !response.data.suggestions.some((s) => s.includes("echolalia")) &&
        response.data.confidence >= 0.9;

      if (isSuccess) {
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
            audioChunksRef.current = [];
          }, 500);
        };
      } else if (response.data.suggestions?.length > 0) {
        speakText(response.data.suggestions.join(". "));
      }
    } catch (err) {
      handleError(err.response?.data?.detail || "Analysis failed");
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

            {result && (
              <div
                className={`feedback-box ${
                  result.confidence >= 0.9 &&
                  !result.suggestions.some((s) => s.includes("echolalia"))
                    ? "positive"
                    : "improvement-needed"
                }`}
              >
                {result.confidence >= 0.9 &&
                !result.suggestions.some((s) => s.includes("echolalia")) ? (
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
                        {suggestion.includes("echolalia") ? "🔄 " : "💡 "}
                        {suggestion.replace(
                          "Try to stay on topic",
                          `Focus on: ${currentQuestion}`
                        )}
                      </div>
                    ))}
                    <div
                      className="question-reminder"
                      onMouseEnter={() =>
                        handleHoverSpeak(
                          `Remember the question was: ${currentQuestion}`
                        )
                      }
                      onMouseLeave={() => speechSynth.current.cancel()}
                    >
                      Remember the question was: {currentQuestion}
                    </div>
                  </>
                )}
              </div>
            )}

            {error && <div className="error-box">{error}</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationTraining;