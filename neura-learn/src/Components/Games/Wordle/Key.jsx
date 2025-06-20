import React, { useContext } from "react";
import { GameContext } from "./WordleGame";

function Key({ keyVal, bigKey, disabled }) {
  const { gameOver, onSelectLetter, onDelete, onEnter } =
    useContext(GameContext);

  const selectLetter = () => {
    if (gameOver.gameOver) return;
    if (keyVal === "ENTER") {
      onEnter();
    } else if (keyVal === "⌫") {
      onDelete();
    } else {
      onSelectLetter(keyVal);
    }
  };
  return (
    <div
      className="key"
      id={bigKey ? "big" : disabled ? "disabled" : undefined}
      onClick={selectLetter}
    >
      {keyVal}
    </div>
  );
}

export default Key;
