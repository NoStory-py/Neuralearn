import React, { useState, useEffect } from 'react';
import MemoryCard from './MemoryCard';
import './MemoryGame.css'

const MemoryGame = () => {
  const maxTime = 120;
  const [timeLeft, setTimeLeft] = useState(maxTime);
  const [flips, setFlips] = useState(0);
  const [matchedCard, setMatchedCard] = useState(0);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [disableDeck, setDisableDeck] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    shuffleCard();
    const timer = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(timer);
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const shuffleCard = () => {
    setFlips(0);
    setMatchedCard(0);
    setDisableDeck(false);
    setIsPlaying(false);

    let arr = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6];
    arr.sort(() => Math.random() > 0.5 ? 1 : -1);

    setCards(arr.map((img, index) => ({
      id: index,
      image: `/Images/img-${index}.png`,
      flipped: false,
      shake: false,
    })));
  };

  const flipCard = (id) => {
    if (!isPlaying || disableDeck) return;

    const updatedCards = [...cards];
    const card = updatedCards.find((card) => card.id === id);
    card.flipped = !card.flipped;

    setCards(updatedCards);
    setFlips((prev) => prev + 1);

    if (flippedCards.length === 0) {
      setFlippedCards([card]);
    } else {
      const [firstCard] = flippedCards;
      if (firstCard.image === card.image) {
        setMatchedCard((prev) => prev + 1);
        setFlippedCards([]);
        if (matchedCard + 1 === 6) {
          setIsPlaying(false);
        }
      } else {
        setDisableDeck(true);
        setShake(true);
        setTimeout(() => {
          card.flipped = false;
          firstCard.flipped = false;
          setCards(updatedCards);
          setFlippedCards([]);
          setDisableDeck(false);
          setShake(false);
        }, 1200);
      }
    }
  };

  return (
    <div className = "memory-body">
    <div className="wrapper">
      <ul className="cards">
        {cards.map((card) => (
          <MemoryCard
            key={card.id}
            image={card.image}
            onClick={() => flipCard(card.id)}
            flipped={card.flipped}
            shake={shake}
          />
        ))}
      </ul>
      <div className="details">
        <p className="time">Time: <span><b>{timeLeft}</b>s</span></p>
        <p className="flips">Flips: <span><b>{flips}</b></span></p>
        <button onClick={shuffleCard}>Refresh</button>
      </div>
    </div>
    </div>
  );
};

export default MemoryGame;
