import React, { useState, useEffect } from "react";
import VideoSection from "./VideoSection"
import NavigationButtons from "./NavigationButtons";
import "./ModulesMaths.css";

const ModulesMaths = () => {
  const [currentLesson, setCurrentLesson] = useState(1);
  const [response, setResponse] = useState("");
  const [circleResponse, setCircleResponse] = useState("");
  const [additionResponse, setAdditionResponse] = useState("");
  const [subtractionResponse, setSubtractionResponse] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentLesson]);

  const checkAnswer = () => {
    const input = document.getElementById("userAnswer").value;
    setResponse(input === "2" ? "Correct!" : "Try again!");
  };

  const checkCircleAnswer = () => {
    const input = document.getElementById("userAnswer").value;
    setCircleResponse(input === "6" ? "Great job!" : "Oops! Try again.");
  };

  const checkAdditionAnswer = () => {
    const input = document.getElementById("userAnswer").value;
    setAdditionResponse(input === "3" ? "Well done!" : "Try again!");
  };

  const checkSubtractionAnswer = () => {
    const input = document.getElementById("userAnswer").value;
    setSubtractionResponse(input === "3" ? "Excellent!" : "Hmm, not quite.");
  };

  const renderLesson = () => {
    switch (currentLesson) {
      case 1:
        return (
          <>
            <MathsModuleCard
              title="Lesson 1: Learn to Count with Hands"
              desc="Let's learn how to count numbers using your fingers. Start by holding up one finger, then two, and keep counting up to ten."
              src="/Images/math.jpg"
              alt="Counting with Hands"
              task="Try to count the number with your finger."
              answer={false}
            />

            <div className="navigation-buttons-maths">
              <NavigationButtons
                buttons={[{ name: "Next Lesson", action: () => setCurrentLesson((prev) => prev + 1) }]}
              />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <MathsModuleCard
              title="Lesson 2: Numbers and Objects"
              desc="In this lesson, you will match numbers with objects. If you see the number 2, try to find two apples, two toys, or two fingers on your hand."
              src="/Images/math2.png"
              alt="Numbers and Objects"
              task="Can you count how many apples are in this picture?"
              action={checkAnswer}
              response={response}
            />

            <div className="navigation-buttons-maths">
              <NavigationButtons
                buttons={[
                  { name: "Previous", action: () => setCurrentLesson((prev) => Math.max(prev - 1, 1)) },
                  { name: "Modules", link: "/learning-modules" },
                  { name: "Next Lesson", action: () => setCurrentLesson((prev) => prev + 1) }
                ]}
                includeModules={false}
              />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <MathsModuleCard
              title="Lesson 3: Recognizing Shapes"
              desc="Shapes are everywhere! Look at these shapes: Circle, Square, and Triangle. Can you find things around your house that match these shapes?"
              src="/Images/math3.jpg"
              alt="Recognizing Shapes"
              task="Let's practice! How many circles can you see in the image?"
              action={checkCircleAnswer}
              response={circleResponse}
            />

            <div className="navigation-buttons-maths">
              <NavigationButtons
                buttons={[
                  { name: "Previous", action: () => setCurrentLesson((prev) => Math.max(prev - 1, 1)) },
                  { name: "Modules", link: "/learning-modules" },
                  { name: "Next Lesson", action: () => setCurrentLesson((prev) => prev + 1) }
                ]}
                includeModules={false}
              />
            </div>
          </>
        );
      case 4:
        return (
          <>
            <MathsModuleCard
              title="Lesson 4: Simple Addition"
              desc="Addition means putting two numbers together. Let’s start by adding small numbers. For example, if you have 1 apple and someone gives you 1 more, how many apples do you have in total?"
              src="/Images/math4.png"
              alt="Simple Addition"
              task="Try adding: 2 + 1 = ?"
              action={checkAdditionAnswer}
              response={additionResponse}
            />

            <div className="navigation-buttons-maths">
              <NavigationButtons
                buttons={[
                  { name: "Previous", action: () => setCurrentLesson((prev) => Math.max(prev - 1, 1)) },
                  { name: "Modules", link: "/learning-modules" },
                  { name: "Next Lesson", action: () => setCurrentLesson((prev) => prev + 1) }
                ]}
                includeModules={false}
              />
            </div>
          </>
        );
      case 5:
        return (
          <>
            <MathsModuleCard
              title="Lesson 5: Simple Subtraction"
              desc="Subtraction means taking away. If you have 3 apples and you give 1 away, how many do you have left?"
              src="/Images/math5.png"
              alt="Simple Subtraction"
              task="Try this subtraction: 5 - 2 = ?"
              action={checkSubtractionAnswer}
              response={subtractionResponse}
            />

            <div className="navigation-buttons-maths">
              <NavigationButtons
                buttons={[
                  { name: "Previous", action: () => setCurrentLesson((prev) => Math.max(prev - 1, 1)) },
                  { name: "Modules", link: "/learning-modules" },
                  { name: "Start Test", link: "/learning-modules/maths/test" }
                ]}
                includeModules={false}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="body-maths"><br />
      <div className="lesson-content">
        <h2>Math Lessons</h2>
        {renderLesson()}
        <VideoSection
          title="Video Explaination"
          desc="Video explanation for basic addition and subtraction:"
          src="https://www.youtube.com/embed/mjlsSYLLOSE?si=MTpWkDmFcT8ObWn9&amp;start=9"
        />
      </div><br />
    </div>
  );
};

export default ModulesMaths;

function MathsModuleCard({ title, desc, src, alt, task, answer = true, action, response }) {
  return (
    <>
      <h3>{title}</h3>
      <p><strong>{desc}</strong></p>
      <img src={src} alt={alt} className="img-fluid" />
      <p><strong>{task}</strong></p>
      {answer && (
        <>
          <input type="text" id="userAnswer" placeholder="Enter your answer" className="form-control" />
          <NavigationButtons
            buttons={[
              { name: "Submit", action: action },
            ]}
            includeModules={false}
          />
          <div className="response-message-maths">{response}</div>
        </>
      )}
    </>
  );
}
