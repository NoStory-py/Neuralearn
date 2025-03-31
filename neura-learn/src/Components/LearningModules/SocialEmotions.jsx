import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "./SocialEmotions.css";

const CameraAccess = () => {
  const webcamRef = useRef(null);
  const [emotion, setEmotion] = useState(null);
  const [error, setError] = useState(null);

  const videoConstraints = {
    facingMode: "user",
    width: { ideal: 720 },
    height: { ideal: 1280 },
  };

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    try {
      // Convert base64 to binary
      const byteString = atob(imageSrc.split(",")[1]);
      const mimeString = imageSrc.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // Send to FastAPI backend
      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      const response = await axios.post("http://localhost:8000/model/predict-emotion", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEmotion(response.data.emotion);
    } catch (err) {
      console.error("Error sending image to backend:", err);
      setError("Error analyzing emotion.");
    }
  }, []);

  return (
    <div className="camera-wrapper">
      {error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      ) : (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="webcam-video"
            onUserMediaError={() => setError("Camera access denied. Please enable permissions.")}
          />
          <button id="btn-capture-socialemotion" className="btn-capture" onClick={capture}>
            📸 Capture
          </button>
          {emotion && (
            <div className="display-emotion">😊 Detected Emotion: <strong>{emotion}</strong></div>
          )}
        </>
      )}
    </div>
  );
};

const SocialEmotions = () => {
  const [cameraOn, setCameraOn] = useState(false);
  const hasCameraSupport = !!navigator.mediaDevices?.getUserMedia;

  return (
    <div className="social-emotions-container">
      <h1 className="app-title">Emotion Recognition Helper</h1>
      <p className="app-description">
        Look at the camera and we'll help you understand your emotions!
      </p>
      {!hasCameraSupport ? (
        <div className="error-message">⚠️ Camera access is not supported in your browser.</div>
      ) : cameraOn ? (
        <>
          <button id="btn-control-socialemotion" className="btn btn-control" onClick={() => setCameraOn(false)}>
            🚫 Stop Camera
          </button>
          <CameraAccess />
        </>
      ) : (
        <button id="btn-start-socialemotion" className="btn btn-start" onClick={() => setCameraOn(true)}>
          🎬 Start Recognition
        </button>
      )}
      <div className="safety-notice">
        🔒 We never store or share your camera feed. Everything stays private on your device.
      </div>
    </div>
  );
};

export default SocialEmotions;