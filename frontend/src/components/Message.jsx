// src/components/Message.jsx
import React from "react";

// Avatar component
const Avatar = ({ isUser, isError }) => {
  const className = `avatar ${isUser ? "user-avatar" : isError ? "bot-avatar error" : "bot-avatar"}`;
  return (
    <div className="message-avatar">
      <div className={className} style={{ padding: 8, borderRadius: 8, background: isUser ? "#e6f4ff" : isError ? "#ffe6e6" : "#eef2ff" }}>
        {isUser ? "U" : "AI"}
      </div>
    </div>
  );
};

const Message = ({ message, isUser, timestamp, confidence, matchStrategy, onToggleSolution, isExpanded }) => {
  const isBot = !isUser;

  // Normalize bot response
  const getMessageContent = () => {
    if (isUser) {
      return typeof message === "string" ? message : (message?.text ?? JSON.stringify(message));
    } else if (message && typeof message === "object") {
      // expected shape: { found: bool, error: string, solution: [] }
      return {
        found: Boolean(message.found),
        error: message.error ?? (message.found ? "Solution" : "No answer"),
        solution: Array.isArray(message.solution) ? message.solution : (typeof message.solution === "string" ? [message.solution] : []),
        isError: Boolean(message.isError)
      };
    } else if (typeof message === "string") {
      return {
        found: true,
        error: message,
        solution: []
      };
    } else {
      return {
        found: false,
        error: "Invalid Response",
        solution: ["The server returned an invalid format."],
      };
    }
  };

  const messageContent = getMessageContent();
  const isError = isBot && (messageContent.isError || !messageContent.found);

  const formatTime = (date) =>
    date ? new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";

  return (
    <div className={`message ${isUser ? "user-message" : "bot-message"}`} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <Avatar isUser={isUser} isError={isError} />

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 600 }}>{isUser ? "You" : "Troubleshoot AI"}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{formatTime(timestamp)}</div>
          </div>

          {confidence != null && !isUser && (
            <div style={{ fontSize: 12, background: "#f1f5f9", padding: "4px 8px", borderRadius: 999 }}>{Math.round(confidence * 100)}%</div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          {isUser && <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{messageContent}</p>}

          {isBot && isError && (
            <div style={{ borderLeft: "3px solid #f59e0b", padding: 10, background: "#fff7ed", borderRadius: 6 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{messageContent.error}</div>
              {messageContent.solution?.map((s, i) => (
                <p key={i} style={{ margin: "4px 0" }}>{s}</p>
              ))}
            </div>
          )}

          {isBot && !isError && (
            <div style={{ borderRadius: 8, background: "#f8fafc", padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}></span>
                  <div style={{ fontWeight: 700 }}>{messageContent.error}</div>
                </div>

                {matchStrategy && <div style={{ fontSize: 12, color: "#0f172a" }}>{matchStrategy}</div>}
              </div>

              <div>
                {messageContent.solution?.length ? messageContent.solution.map((step, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ minWidth: 22, height: 22, borderRadius: 22, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>{idx + 1}</div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{step}</div>
                  </div>
                )) : <div style={{ color: "#666" }}>No steps provided.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
