import TestFormat from './TestFormat'

const questionsData = [
    { question: "What is 2 + 2?", options: ["3", "4", "5", "6"], answer: "4" },
    { question: "What is 3 - 1?", options: ["1", "2", "3", "4"], answer: "2" },
    { question: "How many sides does a triangle have?", options: ["2", "3", "4", "5"], answer: "3" },
    { question: "What is 5 + 3?", options: ["6", "7", "8", "9"], answer: "8" },
    { question: "What is 6 - 2?", options: ["2", "3", "4", "5"], answer: "4" },
  ];

const TestMaths = () => {

  return (
    <TestFormat
      link = "/learning-modules/maths"
      title="Maths Quiz"
      questions={questionsData}
     />
  );
};

export default TestMaths;
