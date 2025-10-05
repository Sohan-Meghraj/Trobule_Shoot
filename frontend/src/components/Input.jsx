// src/components/Input.jsx
import React, { useState, useRef, useEffect } from "react";

const SendIcon = () => <span className="icon-send">➤</span>;
const ClockIcon = () => <span className="icon-clock">⌚</span>;

const Input = ({ onSendMessage, disabled, isTyping }) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [message]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickQuestions = ["WiFi not working", "Computer running slow", "Outlook not opening", "Printer issues"];

  return (
    <div className="input-container" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {!message && (
        <div className="quick-questions" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#666", fontSize: 13 }}>
            <ClockIcon />
            <span>Common issues:</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                className="quick-question-btn"
                onClick={() => onSendMessage(q)}
                disabled={disabled}
                type="button"
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="input-form" style={{ display: "flex", gap: 8 }}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your technical issue... (e.g., WiFi not working)"
          disabled={disabled}
          className="message-textarea"
          rows="1"
          maxLength="500"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ddd", resize: "none" }}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className={`send-btn ${message.trim() && !disabled ? "active" : ""}`}
          title="Send message"
          style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: message.trim() && !disabled ? "#2563eb" : "#ccc", color: "#fff", cursor: message.trim() && !disabled ? "pointer" : "not-allowed" }}
        >
          {isTyping ? (
            <div className="typing-indicator" style={{ display: "flex", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: 6, background: "#fff", animation: "blink 1s infinite" }} />
              <div style={{ width: 6, height: 6, borderRadius: 6, background: "#fff", animation: "blink 1s .2s infinite" }} />
              <div style={{ width: 6, height: 6, borderRadius: 6, background: "#fff", animation: "blink 1s .4s infinite" }} />
            </div>
          ) : (
            <SendIcon />
          )}
        </button>
      </form>

      <div style={{ fontSize: 12, color: "#666" }}>Press Enter to send • Shift+Enter for new line</div>
    </div>
  );
};

export default Input;
