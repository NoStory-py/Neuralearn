import { useState } from "react";
import './ModulesColors.css'
import VideoSection from './VideoSection'
import NavigationButtons from "./NavigationButtons";

function ModulesColors() {
  const [selectedColor, setSelectedColor] = useState(null);
  const [meaning, setMeaning] = useState("");

  const showColor = (color, meaning) => {
    setSelectedColor(color);
    setMeaning(meaning);
  };

  const colors = [
    { color: "red", meaning: "The color of apples and fire." },
    { color: "green", meaning: "The color of grass and leaves." },
    { color: "blue", meaning: "The color of the sky and the ocean." },
    { color: "yellow", meaning: "The color of the sun and bananas." },
    { color: "orange", meaning: "The color of carrots and oranges." },
  ];

  return (
    <div className="body-colors">
      <h1><b>Learn Colors!</b></h1>
      <div
        className="large-color-box"
        style={{ backgroundColor: selectedColor || "transparent", display: selectedColor ? "block" : "none" }}
        aria-live="polite"
      >
        {selectedColor && (
          <p className="large-color-box-text">
            <strong>{selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)}</strong>
            : {meaning}
          </p>
        )}
      </div>

      <div>
        <h2><b>Colors and Their Meanings</b></h2>
        <div className = "colors-container">
        {colors.map(({ color, meaning }) => (
          <div className="card" key={color}>
            <div
              className="color-box"
              style={{ backgroundColor: color, cursor: "pointer" }}
              onClick={() => showColor(color, meaning)}
            ></div>
            <p>
              <strong>{color.charAt(0).toUpperCase() + color.slice(1)}:</strong> {meaning}
            </p>
          </div>
        ))}
        </div>
      </div>

      <NavigationButtons
      buttons = {[{name: "Start Test", link: "/learning-modules/colors/test"}]}
      />

      <VideoSection
        title="Video Explaination"
        desc="Refer to this video for better understanding:"
        src="https://www.youtube.com/embed/qhOTU8_1Af4"
      />

    </div>
  );
}

export default ModulesColors;