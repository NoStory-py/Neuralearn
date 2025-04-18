import { useState, useEffect } from "react";
import { useNavigate ,Link } from "react-router-dom";
import "./Login.css";
import api from "./api"; 

const Login = () => {
  // State declarations
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("token"); 

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home"); 
    }
  }, [isAuthenticated, navigate]);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/login", { email, password });
      
      // Changed this condition
      if (response.data.token) { // 👈 Check for token existence instead of "success"
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.userId);
        
        // Force refresh to update protected routes
        window.location.href = "/home"; // 👈 Temporary workaround
        // Or: navigate("/home", { replace: true });
      }
      
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-container" style={{ background: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)" }}>
      <div className="login-card">
        <div className="character-container">
          <img src="/Images/login-bear.jpg" alt="Friendly Bear" className="welcome-character" />
          <div className="speech-bubble">Welcome Back, Friend!</div>
        </div>

        <h2 style={{ color: "#ff6b6b", fontFamily: "'Bubblegum Sans', cursive" }}>
          Let's Play Again! 🎈
        </h2>

        {error && <div className="error-message" style={{ background: "#fff3cd", borderRadius: "20px" }}>🐻❄️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ color: "#4d4d4d", fontFamily: "'Comic Neue', cursive" }}>
              📧 Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
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
              🔑 Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  border: "3px solid #4ecdc4",
                  borderRadius: "15px",
                  padding: "12px",
                  fontSize: "18px"
                }}
              />
            </label>
          </div>

          <div className="options-row">
            <label className="remember-me" style={{ color: "#4d4d4d" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ transform: "scale(1.5)", marginRight: "8px" }}
              />
              Remember me 😊
            </label>
            <Link to="/forgot-password" style={{ color: "#ff6b6b", textDecoration: "underline wavy" }}>
              Forgot Password? 🎈
            </Link>
          </div>

          <button
            type="submit"
            style={{
              background: "linear-gradient(45deg, #ff6b6b, #ff8e8e)",
              borderRadius: "25px",
              padding: "15px 30px",
              fontSize: "20px",
              fontFamily: "'Bubblegum Sans', cursive",
              boxShadow: "0 4px 15px rgba(255,107,107,0.4)"
            }}
          >
            Let's Play! 🎉
          </button>
        </form>

        <div className="signup-link" style={{ color: "#4d4d4d" }}>
          New friend? <Link to="/Signup" style={{ color: "#4ecdc4", fontWeight: "bold" }}>Join the Party! 🎈</Link>
        </div>

        <div className="decorations">
          <div className="star star-1">⭐</div>
          <div className="star star-2">🌟</div>
          <div className="cloud cloud-1">☁️</div>
        </div>
      </div>
    </div>
  );
};

export default Login;