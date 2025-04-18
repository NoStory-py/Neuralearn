import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css"; 
import api from "./api";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate();
 
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await api.post("/signup", { email, password });
      console.log("Signup API Response:", response.data); // Add this
      
      if (response.status === 201) {
        const loginResponse = await api.post("/login", { email, password });

        if (loginResponse.data.token) {
          console.log("Login API Response:", loginResponse.data);
          localStorage.setItem("token", loginResponse.data.token);
          localStorage.setItem("userId", loginResponse.data.userId);
          navigate("/profile/update"); 
        }
      }
    
    } catch (err) {
      console.error("Signup Error:", err.response?.data); // Add this
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="login-container" style={{ background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" }}>
      <div className="signup-card">
        <div className="character-container">
          <img src="/Images/signup-penguin.jpg" alt="Happy Penguin" className="welcome-character" />
          <div className="speech-bubble">Let's Be Friends! 🐧</div>
        </div>

        <h2 style={{ color: "#4ecdc4", fontFamily: "'Bubblegum Sans', cursive" }}>
          Join the Fun Club! 🎪
        </h2>

        {error && <div className="error-message" style={{ background: "#fff3cd" }}>🐧 {error}</div>}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label style={{ color: "#4d4d4d", fontFamily: "'Comic Neue', cursive" }}>
              📧 Grown-up Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  border: "3px solid #ff6b6b",
                  borderRadius: "15px",
                  padding: "12px",
                  fontSize: "18px"
                }}
              />
            </label>
          </div>

          <div className="form-group">
            <label style={{ color: "#4d4d4d", fontFamily: "'Comic Neue', cursive" }}>
              🔐 Secret Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  border: "3px solid #ffd700",
                  borderRadius: "15px",
                  padding: "12px",
                  fontSize: "18px"
                }}
              />
            </label>
          </div>

          <div className="form-group">
            <label style={{ color: "#4d4d4d", fontFamily: "'Comic Neue', cursive" }}>
              🔍 Repeat Secret Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  border: "3px solid #ffd700",
                  borderRadius: "15px",
                  padding: "12px",
                  fontSize: "18px"
                }}
              />
            </label>
          </div>

          <div className="terms-row">
            <label style={{ color: "#4d4d4d" }}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={{ transform: "scale(1.5)", marginRight: "8px" }}
              />
              I promise to be kind and follow the fun rules! 🤝
            </label>
          </div>

          <button
            type="submit"
            style={{
              background: "linear-gradient(45deg, #4ecdc4, #88dac8)",
              borderRadius: "25px",
              padding: "15px 30px",
              fontSize: "20px",
              fontFamily: "'Bubblegum Sans', cursive",
              boxShadow: "0 4px 15px rgba(78,205,196,0.4)"
            }}
          >
            Let's Play Together! 🎉
          </button>
        </form>

        <div className="login-link" style={{ color: "#4d4d4d", marginTop: "20px" }}>
          Already a member? <Link to="/login" style={{ color: "#ff6b6b", fontWeight: "bold" }}>Come Play Again! 🎈</Link>
        </div>

        <div className="decorations">
          <div className="balloon balloon-1">🎈</div>
          <div className="balloon balloon-2">🎈</div>
          <div className="star star-3">🌈</div>
        </div>
      </div>
    </div>
  );
};

export default Signup;