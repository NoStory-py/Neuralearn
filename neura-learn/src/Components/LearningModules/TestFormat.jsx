import React, { useState, useEffect, useCallback, useRef } from "react";
import "./TestFormat.css";
import NavigationButtons from "./NavigationButtons";

const TestFormat = ({ title, questions = [], renderQuestion, link }) => {
  const [shuffledQuestions] = useState(() =>
    [...questions].sort(() => Math.random() - 0.5)
  );
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [showResults, setShowResults] = useState(false);
  const [answered, setAnswered] = useState(false);
  const timerRef = useRef(null);
  const submittedRef = useRef(false);

  const handleAnswer = useCallback(async (selected) => {

    if (answered || current >= shuffledQuestions.length) return;

    setAnswered(true);
    const isCorrect = selected === shuffledQuestions[current].answer;
    if (isCorrect) setScore(prev => prev + 1);

    clearInterval(timerRef.current);
    setTimeout(() => {
      const next = current + 1;
      if (next < shuffledQuestions.length) {
        setCurrent(next);
        setTimeLeft(10);
        setAnswered(false);
      } else {
        setShowResults(true);
      }
    }, 500);
  }, [current, answered, shuffledQuestions]);

  useEffect(() => {
    if (showResults) return

    timerRef.current = setInterval(() => {
      setTimeLeft(t => (t <= 1 ? (handleAnswer(""), 0) : t - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [current, showResults, handleAnswer]);


  useEffect(() => {
    if (!showResults || submittedRef.current) return;
    submittedRef.current = true;

    const submit = async () => {
      try {
        const response = await fetch("http://localhost:8000/test", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ module: title, marks: [score] }),
        });

        if (!response.ok) {
  
          console.error("Failed to save score:", response.status, await response.text());
          return;
        }

        console.log("Score saved successfully!");
      } catch (err) {

        console.error("Network error while saving score:", err);
      }
    };

    submit();
  }, [showResults, score, title]);

  if (!shuffledQuestions[current]) {
    return <div>Loading question...</div>;
  }

  if (showResults) {
    const scorePercentage = (score / shuffledQuestions.length) * 100;
    const stars = Math.ceil(scorePercentage / 20); // Convert to 1-5 stars

    return (
      <div className="test-container d-flex justify-content-center align-items-center vh-100">
        <div className="p-4 p-md-5 rounded-4 shadow-lg bg-white bg-opacity-85 backdrop-blur border border-white border-opacity-30"
          style={{ maxWidth: '600px' }}>

          <h1 className="text-center mb-4" style={{ color: '#d87c6b' }}>🎉 Quiz Completed!</h1>

          {/* Star Rating Animation */}
          <div className="d-flex justify-content-center mb-3">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`display-4 ${i < stars ? 'text-warning' : 'text-secondary opacity-25'} 
                           animate__animated ${i < stars ? 'animate__bounceIn' : ''}`}
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                {i < stars ? '★' : '☆'}
              </span>
            ))}
          </div>

          <div className={`text-center display-3 fw-bold mb-3 ${scorePercentage === 100 ? 'text-success' :
            scorePercentage >= 50 ? 'text-warning' : 'text-danger'
            }`}>
            {score}/{shuffledQuestions.length}
          </div>

          <p className="text-center h5 mb-4" style={{ color: '#7a6b8f' }}>
            {scorePercentage === 100 ? "Perfect! ✨" :
              scorePercentage >= 70 ? "Great job! 🌟" :
                scorePercentage >= 50 ? "Good effort! 💪" : "Keep practicing! 🔄"}
          </p>


          <div className="d-flex justify-content-center gap-3">

            <button
              onClick={() => window.location.reload()}
              className="test-nav-button rounded-pill"
              style={{ background: '#00FF9D', color: '#003320' }}>
              🔄 Retest
            </button>
            <NavigationButtons
              buttons={[{ name: "⬅️ Go Back", link: link }]}
            />

          </div>
        </div>
      </div >
    );
  }

  const question = shuffledQuestions[current];

  return (

    <div className="test-container">
      <div className="container d-flex flex-column justify-content-center align-items-center vh-100">
        <h1>{title} Quiz</h1>
        <div className={`fw-bold ${timeLeft <= 3 ? "timer-danger" : "timer"}`}>
          Time Left: {timeLeft}s
        </div>
        <div className="question-card">
          {renderQuestion ? renderQuestion(question) : <h5><strong>Q. {question.question}</strong></h5>}
          <br />
          {question.options.map((opt, index) => (
            <div key={opt} className="test-option" onClick={() => handleAnswer(opt)}>
              {index + 1 + ")"} {opt}
            </div>
          ))}
          <div className="progress">
            <div className="progress-bar" style={{ width: `${((current + 1) / shuffledQuestions.length) * 100}%` }}>
              {Math.round(((current + 1) / shuffledQuestions.length) * 100)}%
            </div>
          </div>
          <div className="progress-text">
            Question {current + 1} of {shuffledQuestions.length}
          </div>
        </div>
        <NavigationButtons
          buttons={[{ name: "⬅️ Go Back", link: link }]}
        />

      </div>
    </div>
  );
};

export default TestFormat;
