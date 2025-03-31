import React from 'react';
import { Link } from 'react-router-dom';
import './VoiceRecognition.css';

const VoiceRecognitionLanding = () => {
  const activities = [
    {
      id: 'speech_accuracy',
      title: 'Speech Accuracy',
      desc: 'Practice pronunciation and speech clarity',
      color: '#8EC5FC',
      route: '/learning-modules/Voice/SpeechTraining'
    },
    {
      id: 'conversation',
      title: 'Conversation Training',
      desc: 'Improve conversational responses',
      color: '#B19CD9',
      route: '/learning-modules/Voice/ConversationTraining'
    }
  ];

  return (
    <div className="voice-body-learning">
      <div className="container">
        <h1 className="voice-title">Speech Activities</h1>
        
        <div className="row voice-subject-selection justify-content-center">
          {activities.map((activity) => (
            <div key={activity.id} className="col-md-6 col-lg-4 mb-4">
              <Link to={activity.route} className="voice-link">
                <div 
                  className="voice-card"
                  style={{ backgroundColor: activity.color }}
                >
                  <h3>{activity.title}</h3>
                  <p>{activity.desc}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecognitionLanding;