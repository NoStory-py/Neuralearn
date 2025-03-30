import React, { useState, useEffect, useCallback } from "react";
import { Link } from 'react-router-dom';
import "./TestFormat.css";
import Navigation from "./Navigation";

const TestFormat = ({ title, questions, renderQuestion, link }) => {
  const [shuffledQuestions] = useState(shuffleArray([...questions]));
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [showResults, setShowResults] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handleAnswer = useCallback((selected) => {
    if (answered || current >= shuffledQuestions.length) return;
    const isCorrect = selected === shuffledQuestions[current].answer;
    if (isCorrect) setScore((prev) => prev + 1);
    setAnswered(true);

    setTimeout(() => {
      if (current + 1 < shuffledQuestions.length) {
        setCurrent((prev) => prev + 1);
        setTimeLeft(10);
        setAnswered(false);
      } else {
        setShowResults(true);
      }
    }, 500);
  },
    [current, shuffledQuestions, answered]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleAnswer("");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [current, handleAnswer]);

  if (showResults) {
    return (
      <div className="test-container">
        <h1>Quiz Completed!</h1>
        <h4>Congratulations on completing the test!</h4>
        <h4>Your effort and dedication are truly appreciated.</h4>
        <h2><strong>Your Score: {score} / {shuffledQuestions.length}</strong></h2>
        <Link to={link}><button className="test-nav-button">Retest</button></Link>
        <Navigation name="Go Back" link={link} />
      </div>
    );
  }

  const question = shuffledQuestions[current];

  return (
    <div className="test-container">
      <h1>{title}</h1>
      <div className="timer">Time Left: {timeLeft}s</div>
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
            Question {current + 1} of {shuffledQuestions.length}
          </div>
        </div>
      </div>

      <Navigation
        name="Go Back"
        link={link}
      />

    </div>
  );
};

const shuffleArray = (arr) => arr.sort(() => Math.random() - 0.5);

export default TestFormat;
