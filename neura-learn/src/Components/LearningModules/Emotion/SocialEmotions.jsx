import React, { useState, useEffect } from "react";
import "./SocialEmotions.css";
import VideoSection from "../VideoSection";
import CameraCard from "./CameraCard";
import EmotionsCard from "./EmotionCard";

const SocialEmotions = () => {
  const [showCamera, setShowCamera] = useState(false)
  const [chapter, setChapter] = useState(1);
  const [responseMessage, setResponseMessage] = useState('');
  const [userAnswer, setUserAnswer] = useState('');

  const moduledata = [
    {
      desc: "Look at the image below. Can you guess what emotion this person is feeling?",
      task: "What emotion do you see in this picture? Type your answer below.",
      correctAnswer: "happiness",
      response: "Great! This is happiness! We feel happy when something good happens.",
      image: "/Images/happy.jpg"
    },
    {
      desc: "Look at the image below. Can you guess what emotion this group is showing?",
      task: "What emotion do you see in this group? Type your answer below.",
      correctAnswer: "anger",
      response: "Great! This is angry! We feel angry when we experience loss.",
      image: "/Images/angry.jpg"
    }
  ];

  useEffect(() => {
    if (showCamera) {
      setChapter(prev => prev + 1);
    }
  }, [showCamera])

  const handleAnswer = (emotionAnswer) => {
    const currentModule = moduledata[chapter - 1];
    console.log(emotionAnswer)
    // Check if the answer matches the correct answer

    if (emotionAnswer.toLowerCase() === currentModule.correctAnswer) {
      setUserAnswer(emotionAnswer.toLowerCase())
      setResponseMessage(currentModule.response); 
      setShowCamera(true)
      
    } else {
      setResponseMessage("Oops! That’s not the right answer. Try again!"); 
    }
  }
  return (
    <div className="body-emotions">
      <div className="social-emotions-container">
      {showCamera ? (
          <CameraCard
          cameraAnswer = {userAnswer}
          setShowCamera={setShowCamera}
          />
      ) :
      <EmotionsCard
          title="Guess the Emotion!"
          chapter={chapter}
          desc={moduledata[chapter - 1].desc}
          src={moduledata[chapter - 1].image}  // Toggle image based on chapter
          alt="A person expressing an emotion"
          task={moduledata[chapter - 1].task}
          response={responseMessage} // Display the response message
          emotionAnswer={handleAnswer}  // Handle answer submission
        />
        }

        <VideoSection
          title="Video Explaination"
          desc="Refer to this video for better understanding:"
          src="https://www.youtube.com/embed/jetoWelJJJk"
        />
      </div>
    </div>
  );
};

export default SocialEmotions;


