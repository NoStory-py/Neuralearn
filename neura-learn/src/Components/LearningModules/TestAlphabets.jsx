import TestFormat from './TestFormat'

const questionsData = [
  { question: "What is the first letter of the alphabet?", options: ["A", "B", "C"], answer: "A" },
  { question: "What letter comes after C?", options: ["D", "E", "F"], answer: "D" },
  { question: 'What letter is known as the vowel in the word "Apple"?', options: ["A", "P", "L"], answer: "A" },
  { question: "Which letter comes before G?", options: ["F", "H", "I"], answer: "F" },
  { question: "What is the last letter of the alphabet?", options: ["Z", "Y", "X"], answer: "Z" },
];

const TestAlphabets = () => {

  return (
    <TestFormat
      link = "/learning-modules/alphabets"
      title="Alphabets Quiz"
      questions={questionsData}
     />
  );
};

export default TestAlphabets;
