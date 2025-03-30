import TestFormat from './TestFormat'

const questionsData = [
  { color: "red", options: ["Red", "Green", "Blue"], answer: "Red" },
  { color: "green", options: ["Yellow", "Green", "Blue"], answer: "Green" },
  { color: "blue", options: ["Orange", "Blue", "Red"], answer: "Blue" },
  { color: "yellow", options: ["Purple", "Yellow", "Green"], answer: "Yellow" },
  { color: "orange", options: ["Orange", "Red", "Yellow"], answer: "Orange" },
];

const TestColors = () => {


  return (
    <TestFormat
      link="/learning-modules/colors"
      title="Color Quiz"
      questions={questionsData}
      renderQuestion={(question) => (
        <>
          <p><strong>What color is this?</strong></p>
          <div
            className="color-box"
            style={{ backgroundColor: question.color || "transparent", width: "100px", height: "100px", margin: "10px auto", border: "2px solid #000" }}
          />
        </>)}
     />
  );
};

export default TestColors;
