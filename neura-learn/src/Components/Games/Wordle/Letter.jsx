import React, { useContext, useEffect } from "react";
import { GameContext } from "./WordleGame";

function Letter({ letterPos, attemptVal }) {
  const { board, setDisabledLetters, currAttempt, correctWord } =
    useContext(GameContext);
  const letter = board[attemptVal][letterPos];
  const correct = correctWord.toUpperCase()[letterPos] === letter;
  const almost =
    !correct && letter !== "" && correctWord.toUpperCase().includes(letter);
  const letterState =
    currAttempt.attempt > attemptVal &&
    (correct ? "correct" : almost ? "almost" : "error");

  useEffect(() => {
    if (letter !== "" && !correct && !almost) {
      console.log(letter);
      setDisabledLetters((prev) => [...prev, letter]);
    }
  }, [currAttempt.attempt]);
  return (
    <div className="letter" id={letterState || undefined}>
      {letter}
    </div>
  );
}

export default Letter;
