import { useState } from "react";
import NavigationButtons from "../../LearningModules/NavigationButtons";
const WordleRules = () => {
    const [showRules, setShowRules] = useState(false);

    return (
        <div className="container p-2 bg-info text-white border rounded shadow-lg" style={{ maxWidth: "600px" }}>
            <h1>Wordle</h1>
            <h2 className="text-center mb-3"><strong>🎉 Wordle Game Rules! 🎉</strong></h2>
            <div className="text-center">
                <NavigationButtons 
                buttons = {[{name: showRules ? "Hide Rules" : "Show Rules", action: () => setShowRules(!showRules) }]}
                includeModules = {false}
                />
            </div>
            {showRules && (
                <div className="p-3 bg-light border rounded text-dark">
                    <ul className="list-unstyled">
                        <li><strong>🎯 The Goal:</strong> Guess the secret five-letter word! You have 6 tries to get it right!</li>
                        <li><strong>🧩 How to Play:</strong>
                            <ul>
                                <li>Type in any five-letter word and hit "Enter"!</li>
                                <li>Keep guessing until you find the hidden word!</li>
                            </ul>
                        </li>
                        <li><strong>🔍 Clue Time:</strong> After each guess, you’ll get clues:
                            <ul>
                                <li><span className="text-success">🟩 Green:</span> You got a letter in the right spot!</li>
                                <li><span className="text-warning">🟨 Yellow:</span> You found a letter, but it's in the wrong spot!</li>
                                <li><span className="text-secondary">⬜ Grey:</span> Nope! That letter isn’t in the word!</li>
                            </ul>
                        </li>
                        <li><strong>⏳ Take Your Time:</strong> Think carefully! You want to guess the word, not just any word!</li>
                        <li><strong>🤔 Need Help?</strong> You can ask for hints, but use them wisely!</li>
                        <li><strong>🏆 Winning:</strong> If you guess the word in 6 tries or less, you win! Yay!</li>
                        <li><strong>💔 Losing:</strong> If you run out of guesses, don’t worry! The word will be revealed!</li>
                        <li><strong>🎈 Have Fun:</strong> Remember, it’s just a game! Enjoy every guess and have a blast!</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default WordleRules;
