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
You are NeuraBot, a friendly educational assistant.

Explain clearly and simply.
Be supportive.
Help autism learners.
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

        <div className="chatbot-card">

          <div className="chatbot-header">

            <div className="chatbot-left">

              <h1 className="chatbot-title">
                NeuraBot
              </h1>

              <p className="chatbot-subtitle">
                Your friendly learning buddy ✨
              </p>

            </div>

          </div>

        </div>

        <div
          ref={chatRef}
          className="chatbot-chat-section"
        >

          {/* Controls */}

          <div className="chatbot-tts-controls">

            <button
              className="btn btn--sm"
              onClick={() =>
                setAutoSpeak(
                  !autoSpeak
                )
              }
            >
              {autoSpeak
                ? "🔊 Auto ON"
                : "🔇 Auto OFF"}
            </button>

            <select
              value={
                selectedVoice?.name || ""
              }
              onChange={(e) => {

                const voice =
                  voices.find(
                    v =>
                      v.name ===
                      e.target.value
                  );

                setSelectedVoice(
                  voice
                );

              }}
            >

              {voices.map(voice => (

                <option
                  key={voice.name}
                  value={voice.name}
                >
                  {voice.name}
                </option>

              ))}

            </select>

            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speechRate}
              onChange={(e) =>
                setSpeechRate(
                  parseFloat(
                    e.target.value
                  )
                )
              }
            />

            {isSpeaking && (

              <button
                className="btn btn--sm btn--secondary"
                onClick={
                  stopSpeaking
                }
              >
                ⏹ Stop
              </button>

            )}

          </div>

          {/* Messages */}

          <div className="chatbot-chat-messages">

            {messages.map(
              (m, i) => (

                <div
                  key={i}
                  className={`chatbot-message-row ${
                    m.role === "user"
                      ? "user"
                      : "assistant"
                  }`}
                >

                  <div className="chatbot-message-bubble">

                    {m.text}

                    {m.role ===
                      "assistant" && (

                      <button
                        className="chatbot-speak-btn"
                        onClick={() =>
                          speakText(
                            m.text
                          )
                        }
                      >
                        🔊
                      </button>

                    )}

                  </div>

                </div>

              )
            )}

            {isLoading &&
              <div>
                Thinking...
              </div>
            }

          </div>

          {/* Input */}

          <div className="chatbot-chat-input">

            <input
              value={q}
              onChange={(e) =>
                setQ(
                  e.target.value
                )
              }
              onKeyDown={(e) =>
                e.key === "Enter"
                  ? send()
                  : null
              }
              placeholder="Ask anything..."
            />

            <button
              onClick={send}
              disabled={isLoading}
            >
              Send
            </button>

          </div>

          <p>
            🚀 Connected to Pollinations AI
          </p>

        </div>

      </div>

    </div>

  );

}
