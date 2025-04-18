import React from 'react';

const MemoryCard = ({ image, onClick, flipped, shake }) => {
  return (
    <li
      className={`card ${flipped ? 'flip' : ''} ${shake ? 'shake' : ''}`}
      onClick={onClick}
    >
      <div className="view front-view">
        <img src="/Images/que_icon.svg" alt="icon" />
      </div>
      <div className="view back-view">
        <img src={image} alt="card-img" />
      </div>
    </li>
  );
};

export default MemoryCard;
