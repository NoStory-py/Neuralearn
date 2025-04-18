import TestFormat from './TestFormat'

const questionsData = [
  { question: "What shape has three sides?", options: ["Triangle", "Square", "Circle"], answer: "Triangle" },
  { question: "What shape has four equal sides?", options: ["Square", "Rectangle", "Hexagon"], answer: "Square" },
  { question: "What shape has no corners?", options: ["Circle", "Triangle", "Rectangle"], answer: "Circle" },
  { question: "What shape has six sides?", options: ["Hexagon", "Square", "Triangle"], answer: "Hexagon" },
  { question: "What shape has four sides but not equal sides?", options: ["Rectangle", "Square", "Circle"], answer: "Rectangle" },
];

const TestShapes = () => {

  return (
    <TestFormat
      link = "/learning-modules/shapes"
      title="Shapes Quiz"
      questions={questionsData}
     />
  );
};

export default TestShapes;
