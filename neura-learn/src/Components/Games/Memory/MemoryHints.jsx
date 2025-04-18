import React, { useState } from 'react';

const MemoryHints = () => {
  const [showHints, setShowHints] = useState(false);

  const toggleHints = () => setShowHints(!showHints);

  return (
    <div className="container">
      <button className="btn btn-lg btn-primary" onClick={toggleHints}>
        Game Hints
      </button>
      {showHints && (
        <div className="hints-content" style={{ marginTop: '10px' }}>
          <ul>
            <li><strong>Find Pairs:</strong> 👫 Try to match two cards that look the same.</li>
            <li><strong>Remember Cards:</strong> 🧠 When you see a card, remember where it is.</li>
            <li><strong>Look Closely:</strong> 👀 Pay attention to the pictures on the cards.</li>
            <li><strong>Flip Nearby Cards:</strong> 🔄 Flip cards that are close to each other first.</li>
            <li><strong>Take Your Time:</strong> ⏳ Don’t rush! Think before you flip a card.</li>
            <li><strong>Practice Makes You Better:</strong> 🎮 The more you play, the better you’ll get!</li>
            <li><strong>Count Your Flips:</strong> 🔢 Try to flip fewer cards to win faster.</li>
            <li><strong>Stay Calm:</strong> 😌 If you feel upset, take a deep breath and relax.</li>
            <li><strong>Use Refresh Wisely:</strong> 🔄 If you want to start over, use the refresh button.</li>
            <li><strong>Have Fun:</strong> 🎉 Remember, it’s just a game! Enjoy playing!</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MemoryHints;
