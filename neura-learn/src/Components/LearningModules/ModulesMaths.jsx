import React, { useState } from "react";
import VideoSection from "./VideoSection"
import "./ModulesMaths.css";

const InteractiveMathModule = () => {
  const [currentLesson, setCurrentLesson] = useState(1);
  const [response, setResponse] = useState("");
  const [circleResponse, setCircleResponse] = useState("");
  const [additionResponse, setAdditionResponse] = useState("");
  const [subtractionResponse, setSubtractionResponse] = useState("");

  const checkAnswer = () => {
    const input = document.getElementById("userAnswer").value;
    setResponse(input === "2" ? "Correct!" : "Try again!");
  };

  const checkCircleAnswer = () => {
    const input = document.getElementById("circleInput").value;
    setCircleResponse(input === "6" ? "Great job!" : "Oops! Try again.");
  };

  const checkAdditionAnswer = () => {
    const input = document.getElementById("additionInput").value;
    setAdditionResponse(input === "3" ? "Well done!" : "Try again!");
  };

  const checkSubtractionAnswer = () => {
    const input = document.getElementById("subtractionInput").value;
    setSubtractionResponse(input === "3" ? "Excellent!" : "Hmm, not quite.");
  };

  const renderLesson = () => {
    switch (currentLesson) {
      case 1:
        return (
          <div>
            <h3>Lesson 1: Learn to Count with Hands</h3>
            <p><strong>Let's learn how to count numbers using your fingers. Start by holding up one finger, then two, and keep counting up to ten.</strong></p>
            <img src="/Images/math.png" alt="Counting with Hands" className="img-fluid" />
            <p><strong>Try to count the number with your finger.</strong></p>
            <div className="navigation-buttons-maths">
              <button className="btn btn-secondary" onClick={() => window.location.href = "1.html"}>Home</button>
              <button className="btn btn-primary" onClick={() => setCurrentLesson(2)}>Next Lesson</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3>Lesson 2: Numbers and Objects</h3>
            <p><strong>In this lesson, you will match numbers with objects. If you see the number 2, try to find two apples, two toys, or two fingers on your hand.</strong></p>
            <img src="/Images/math2.png" alt="Numbers and Objects" className="img-fluid" style={{ maxWidth: "600px", height: "400px" }} />
            <p><strong>Can you count how many apples are in this picture?</strong></p>
            <label htmlFor="userAnswer">Your Answer:</label>
            <input type="text" id="userAnswer" placeholder="Enter your answer" className="form-control" />
            <button className="btn btn-primary mt-2" onClick={checkAnswer}>Submit</button>
            <div className="response-message-maths">{response}</div>
            <div className="navigation-buttons-maths">
              <button className="btn btn-primary" onClick={() => setCurrentLesson(1)}>Previous</button>
              <button className="btn btn-secondary" onClick={() => window.location.href = "1.html"}>Home</button>
              <button className="btn btn-primary" onClick={() => setCurrentLesson(3)}>Next Lesson</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3>Lesson 3: Recognizing Shapes</h3>
            <p><strong>Shapes are everywhere! Look at these shapes: Circle, Square, and Triangle. Can you find things around your house that match these shapes?</strong></p>
            <img src="/Images/math3.jpg" alt="Recognizing Shapes" className="img-fluid" />
            <p><strong>Let's practice! How many circles can you see in the image?</strong></p>
            <label htmlFor="circleInput">Your Answer:</label>
            <input type="text" id="circleInput" placeholder="Enter your answer" className="form-control" />
            <button className="btn btn-primary mt-2" onClick={checkCircleAnswer}>Submit</button>
            <div className="response-message-maths">{circleResponse}</div>
            <div className="navigation-buttons-maths">
              <button className="btn btn-primary" onClick={() => setCurrentLesson(2)}>Previous</button>
              <button className="btn btn-secondary" onClick={() => window.location.href = "1.html"}>Home</button>
              <button className="btn btn-primary" onClick={() => setCurrentLesson(4)}>Next Lesson</button>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h3>Lesson 4: Simple Addition</h3>
            <p><strong>Addition means putting two numbers together. Let’s start by adding small numbers. For example, if you have 1 apple and someone gives you 1 more, how many apples do you have in total?</strong></p>
            <img src="/Images/math4.png" alt="Simple Addition" className="img-fluid" style={{ maxWidth: "600px" }} />
            <p><strong>Try adding: 2 + 1 = ?</strong></p>
            <label htmlFor="additionInput">Your Answer:</label>
            <input type="text" id="additionInput" placeholder="Enter your answer" className="form-control" />
            <button className="btn btn-primary mt-2" onClick={checkAdditionAnswer}>Submit</button>
            <div className="response-message-maths">{additionResponse}</div>
            <div className="navigation-buttons-maths">
              <button className="btn btn-primary" onClick={() => setCurrentLesson(3)}>Previous</button>
              <button className="btn btn-secondary" onClick={() => window.location.href = "1.html"}>Home</button>
              <button className="btn btn-primary" onClick={() => setCurrentLesson(5)}>Next Lesson</button>
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <h3>Lesson 5: Simple Subtraction</h3>
            <p><strong>Subtraction means taking away. If you have 3 apples and you give 1 away, how many do you have left?</strong></p>
            <img src="/Images/math5.png" alt="Simple Subtraction" className="img-fluid" />
            <p><strong>Try this subtraction: 5 - 2 = ?</strong></p>
            <label htmlFor="subtractionInput">Your Answer:</label>
            <input type="text" id="subtractionInput" className="form-control" />
            <button className="btn btn-primary mt-2" onClick={checkSubtractionAnswer}>Submit</button>
            <div className="response-message-maths">{subtractionResponse}</div>
            <div className="navigation-buttons-maths">
              <button className="btn btn-primary" onClick={() => setCurrentLesson(4)}>Previous</button>
              <button className="btn btn-secondary" onClick={() => window.location.href = "1.html"}>Home</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="body-maths"><br/>
      <div className="lesson-content">
        <h2>Math Lessons</h2>
        {renderLesson()}
        <VideoSection
          title="Video Explaination"
          desc="Video explanation for basic addition and subtraction:"
          src="https://www.youtube.com/embed/mjlsSYLLOSE?si=MTpWkDmFcT8ObWn9&amp;start=9"
        />
      </div><br/>
    </div>
  );
};

export default InteractiveMathModule;
