import React, { useContext } from "react";
import { GameContext } from "./WordleGame";
import NavigationButtons from "../../LearningModules/NavigationButtons";

function GameOver() {
  const {
    currAttempt,
    gameOver,
    correctWord,
  } = useContext(GameContext);
  return (
    <div className="gameOver">
      <h3>
        {gameOver.guessedWord
          ? "You Correctly Guessed the Wordle"
          : "You Failed to Guess the Word"}
      </h3>
      <h1>Correct Word: {correctWord}</h1>
      {gameOver.guessedWord && (
        <h3>You guessed in {currAttempt.attempt} attempts</h3>
      )}
      <NavigationButtons
      buttons = {[{ name: "Replay", action: () => window.location.reload()}]}
      includeModules = {false}
      />
    </div>
  );
}

export default GameOver;
