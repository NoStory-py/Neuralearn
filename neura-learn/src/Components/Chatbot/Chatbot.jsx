import { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

function Pill({ emoji, label, accent }) {
  return (
    <div className={`chatbot-pill ${accent}`}>
      <span className="chatbot-pill-emoji">{emoji}</span>
      <span className="chatbot-pill-label">{label}</span>
    </div>
  );
}

export default function Chatbot() {

  console.log("TOKEN:", import.meta.env.VITE_POLLINATION_CHATBOT_TOKEN);

  const chatRef = useRef(null);

  const [q, setQ] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome to Neuralearn! 🎓 I'm NeuraBot, your friendly learning assistant. Ask me anything!",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [autoSpeak, setAutoSpeak] = useState(true);

  const [voices, setVoices] = useState([]);

  const [selectedVoice, setSelectedVoice] = useState(null);

  const [speechRate, setSpeechRate] = useState(0.95);

  const POLLINATION_TOKEN =
    import.meta.env.POLLINATION_CHATBOT_TOKEN;

  const POLLINATION_URL =
    "https://gen.pollinations.ai/v1/chat/completions";

  // =====================
  // Load voices
  // =====================
  useEffect(() => {

    const loadVoices = () => {

      const available =
        window.speechSynthesis.getVoices();

      const english =
        available.filter(v =>
          v.lang.startsWith("en")
        );

      setVoices(english);

      if (!selectedVoice &&
          english.length > 0)
        setSelectedVoice(english[0]);

    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged =
      loadVoices;

  }, [selectedVoice]);

  // =====================
  // Speak
  // =====================
  const speakText = (text) => {

    window.speechSynthesis.cancel();

    const clean =
      text.replace(/[^\w\s.,?!]/g, "");

    const utterance =
      new SpeechSynthesisUtterance(clean);

    utterance.rate =
      speechRate;

    utterance.pitch = 1.1;

    utterance.volume = 1;

    if (selectedVoice)
      utterance.voice =
        selectedVoice;

    utterance.onstart =
      () => setIsSpeaking(true);

    utterance.onend =
      () => setIsSpeaking(false);

    window.speechSynthesis.speak(
      utterance
    );

  };

  const stopSpeaking = () => {

    window.speechSynthesis.cancel();

    setIsSpeaking(false);

  };

  // =====================
  // Send message
  // =====================
  const send = async () => {

  const trimmed = q.trim();

  if (!trimmed || isLoading)
    return;

  stopSpeaking();

  const userMessage = {
    role: "user",
    text: trimmed,
  };

  setMessages(prev => [
    ...prev,
    userMessage,
  ]);

  setQ("");

  setIsLoading(true);

  try {

    const systemPrompt = `
You are NeuraBot, a friendly educational assistant for children with autism and their caregivers.

Always assume any child, student, or learner mentioned is autistic unless the user clearly says otherwise.

Give autism-friendly guidance using:

simple language

step-by-step explanations

structured and predictable methods

sensory-aware and supportive teaching strategies

Be calm, patient, encouraging, and never give generic parenting advice.
Your goal is to make learning safe, clear, and comfortable for autistic children.
`;

    const pollinationMessages = [

      {
        role: "system",
        content: systemPrompt,
      },

      ...messages.map(m => ({
        role: m.role,
        content: m.text,
      })),

      {
        role: "user",
        content: trimmed,
      },

    ];

    const response = await fetch(
      "https://gen.pollinations.ai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_POLLINATION_CHATBOT_TOKEN}`,
        },

        body: JSON.stringify({
          model: "gemini-2.5-flash-lite",
          messages: pollinationMessages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    // IMPORTANT: Check HTTP errors
    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "Pollinations error:",
        errorText
      );

      throw new Error(
        "API Error"
      );
    }

    const data =
      await response.json();

    console.log(
      "Pollinations response:",
      data
    );

    const reply =
      data?.choices?.[0]?.message
        ?.content;

    if (!reply)
      throw new Error(
        "Empty reply"
      );

    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        text: reply,
      },
    ]);

    if (autoSpeak)
      speakText(reply);

  }

  catch (err) {

    console.error(err);

    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        text:
          "⚠️ Failed to get response from AI. Check console.",
      },
    ]);

  }

  finally {

    setIsLoading(false);

  }

};

  // =====================
  // Auto scroll
  // =====================
  useEffect(() => {

    chatRef.current?.scrollTo({

      top: 999999,

      behavior: "smooth",

    });

  }, [messages]);

  // =====================
  // UI
  // =====================
  return (
  <div className="chatbot-page">

    <div className="chatbot-container">

      {/* ===== Top Card ===== */}
      <div className="chatbot-card">
        <div className="chatbot-header">

          <div className="chatbot-left">
            <h1 className="chatbot-title">NeuraBot</h1>

            <p className="chatbot-subtitle">
              Your friendly learning buddy, ask anything ✨
            </p>

            {/* Pills */}
            <div className="chatbot-pill-grid">
              <Pill emoji="📚" label="General knowledge" accent="chatbot-accent-yellow" />
              <Pill emoji="🧠" label="Application questions" accent="chatbot-accent-sky" />
              <Pill emoji="🤝" label="Virtual Therapist" accent="chatbot-accent-rose" />
              <Pill emoji="💡" label="Problem solving" accent="chatbot-accent-lime" />
            </div>
          </div>

          <div className="chatbot-right">
            <div className="chatbot-bot-card">
              <div className="chatbot-bot-avatar">NL</div>
              <p className="chatbot-bot-name">NeuraBot</p>
              <div className="chatbot-bot-desc">
                Made for learning, playful & safe
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ===== Chat Section ===== */}
      <div ref={chatRef} className="chatbot-chat-section">

        {/* ===== TTS Controls ===== */}
        <div className="chatbot-tts-controls">

          <button
            className={`btn btn--sm ${autoSpeak ? "btn--primary" : "btn--outline"}`}
            onClick={() => setAutoSpeak(!autoSpeak)}
          >
            {autoSpeak ? "🔊 Auto-speak ON" : "🔇 Auto-speak OFF"}
          </button>

          {voices.length > 0 && (
            <select
              className="chatbot-voice-select"
              value={selectedVoice?.name || ""}
              onChange={(e) => {
                const voice = voices.find(v => v.name === e.target.value);
                setSelectedVoice(voice);
              }}
            >
              {voices.map(v => (
                <option key={v.name} value={v.name}>
                  {v.name.split(" - ")[0]}
                </option>
              ))}
            </select>
          )}

          <div className="chatbot-speed-control">
            <label>Speed: {speechRate.toFixed(2)}x</label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="chatbot-speed-slider"
            />
          </div>

          {isSpeaking && (
            <button
              className="btn btn--sm btn--secondary"
              onClick={stopSpeaking}
            >
              ⏹ Stop
            </button>
          )}

        </div>

        {/* ===== Messages ===== */}
        <div className="chatbot-chat-messages">

          {messages.map((m, i) => {
            const isUser = m.role === "user";

            return (
              <div
                key={i}
                className={`chatbot-message-row ${isUser ? "user" : "assistant"}`}
              >
                <div
                  className={`chatbot-message-bubble ${
                    isUser ? "user-bubble" : "assistant-bubble"
                  }`}
                >
                  <div className="chatbot-message-text">
                    {m.text}
                  </div>

                  <div className="chatbot-message-actions">
                    <div
                      className={`chatbot-message-meta ${
                        isUser ? "user-meta" : "assistant-meta"
                      }`}
                    >
                      {isUser ? "You" : "NeuraBot"}
                    </div>

                    {!isUser && (
                      <button
                        className="chatbot-speak-btn"
                        onClick={() => speakText(m.text)}
                        title="Read aloud"
                      >
                        🔊
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="chatbot-message-row assistant">
              <div className="chatbot-message-bubble assistant-bubble">
                <div className="chatbot-message-text">
                  <em>Thinking... 💭</em>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ===== Input ===== */}
        <div className="chatbot-chat-input">

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) send();
            }}
            placeholder="Type your question..."
            className="chatbot-input"
            disabled={isLoading}
          />

          <button
            onClick={send}
            className="chatbot-send-btn"
            disabled={isLoading}
          >
            {isLoading ? "..." : "Send"}
          </button>

        </div>

        <p className="chatbot-tip">
          🚀 Connected to Pollinations AI
        </p>

      </div>

      <div className="chatbot-footer">
        Try resizing the window for responsive vibes ✨
      </div>

    </div>

  </div>
);


}
