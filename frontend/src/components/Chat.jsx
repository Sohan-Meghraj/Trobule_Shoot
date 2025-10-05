// src/components/Chat.jsx
import React, { useState, useRef, useEffect } from "react";
import Message from "./Message";
import Input from "./Input";
import { api } from "../services/api";

const BotIcon = () => <span className="icon-text">AI</span>;

/* -------------------------
   Casual responses + helpers
   ------------------------- */
const CASUAL_RESPONSES = {
  greeting: [
    "Hello! Hope you're doing well 😊 How can I help today?",
    "Hi there! What can I assist you with?",
    "Hey! Need help with something technical?"
  ],
  how_are_you: [
    "I'm an AI so I'm always ready — how can I help you today?",
    "Doing great — thanks! What issue can I help you troubleshoot?"
  ],
  thanks: [
    "You're welcome! Glad to help.",
    "Anytime! If you have more issues, just type them here."
  ],
  bye: [
    "Goodbye! If anything else comes up, ping me here.",
    "See ya — reach out if you need more help!"
  ],
  help: [
    "Sure — tell me briefly what's happening (device, app, error message). Example: 'WiFi not working' or 'Outlook won't open'.",
    "I can help — what's the device and the error? For example: 'printer not printing', 'err 404', 'lost file'."
  ],
};

/* -------------------------
   Issue keyword -> canonical KB query
   (extend this list as you get real queries)
   ------------------------- */
const ISSUE_KEYWORDS = [
  { keywords: ["wifi", "wi-fi", "no internet", "internet not working", "can't connect", "cant connect"], query: "Cannot Connect to Wi-Fi" },
  { keywords: ["overheat", "overheating", "hot", "loud fan", "fan noise"], query: "Computer Overheating or Loud Fan Noise" },
  { keywords: ["404", "not found", "err 404", "error 404"], query: "404 Not Found" },
  { keywords: ["500", "internal server error", "err 500", "error 500"], query: "500 Internal Server Error" },
  { keywords: ["outlook", "outlook not opening", "email not opening", "outlook crashed"], query: "Outlook is Not Opening" },
  { keywords: ["printer", "printing", "printer offline", "cannot print"], query: "Printer issues" },
  { keywords: ["deleted file", "restore file", "recycle bin", "lost file"], query: "Accidentally Deleted a File" },
  { keywords: ["disk space", "low disk space", "running out of disk space", "storage full"], query: "Running Out of Disk Space" },
  // add more mappings here
];

/* -------------------------
   Utility functions
   ------------------------- */
const normalize = (s = "") => s.toLowerCase().trim();

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* Check casual intents first (greetings, thanks, help, bye, how-are-you) */
function detectCasualIntent(text) {
  const t = normalize(text);
  if (!t) return null;

  const greetingWords = ["hi", "hello", "hey", "hiya", "hi!"];
  if (greetingWords.some(w => t === w || t.startsWith(w + " ") )) return {type: "casual", name: "greeting"};

  if (["how are you", "how r you", "how are u", "how is it going"].some(w => t.includes(w))) return {type: "casual", name: "how_are_you"};

  if (["thanks", "thank you", "thx", "cheers"].some(w => t.includes(w))) return {type: "casual", name: "thanks"};

  if (["bye", "goodbye", "see ya", "cya"].some(w => t.includes(w))) return {type: "casual", name: "bye"};

  if (["help", "i need help", "please help"].some(w => t === w || t.startsWith(w + " "))) return {type: "casual", name: "help"};

  return null;
}

/* Keyword matching for troubleshooting */
function detectIssueIntent(text) {
  const t = normalize(text);
  if (!t) return null;

  for (const entry of ISSUE_KEYWORDS) {
    for (const kw of entry.keywords) {
      if (t.includes(kw)) {
        return { type: "issue", query: entry.query, matched: kw };
      }
    }
  }
  return null;
}

/* -------------------------
   Main component
   ------------------------- */
const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedSolutions, setExpandedSolutions] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // autoscroll
  const scrollToBottom = (smooth = true) => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest" });
    } catch (e) {}
  };

  useEffect(() => {
    const welcomeMessage = {
      id: "welcome-1",
      type: "bot",
      content: {
        found: true,
        error: "Welcome to Troubleshoot AI",
        solution: [
          "Hi...! How can I assist you today?"
        ],
      },
      timestamp: new Date().toISOString(),
      confidence: 1,
      matchStrategy: "welcome"
    };
    setMessages([welcomeMessage]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleSolutionExpansion = (messageId) => {
    setExpandedSolutions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) newSet.delete(messageId);
      else newSet.add(messageId);
      return newSet;
    });
  };

  /* Main send handler - enhanced with intent detection */
  const handleSendMessage = async (messageText) => {
    if (!messageText || !messageText.trim()) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      type: "user",
      content: messageText.trim(),
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    // detect casual intent first (local short-circuit)
    const casual = detectCasualIntent(messageText);
    if (casual) {
      const responseText = pickRandom(CASUAL_RESPONSES[casual.name] || ["Hello!"]);
      const botMessage = {
        id: `b-casual-${Date.now()}`,
        type: "bot",
        content: {
          found: true,
          error: responseText,
          solution: []
        },
        timestamp: new Date().toISOString(),
        confidence: 1,
        matchStrategy: "casual"
      };
      setMessages(prev => [...prev, botMessage]);
      return; // do not call backend for small talk
    }

    // detect keyword-based issue mapping
    const issueDetected = detectIssueIntent(messageText);
    const queryToSend = issueDetected ? issueDetected.query : messageText.trim();

    // show typing indicator and call backend
    setIsTyping(true);
    try {
      // small delay so the typing indicator shows
      await new Promise(r => setTimeout(r, 250));
      const response = await api.askQuestion(queryToSend);
      // If we used mapping, tag the response so UI shows where it came from
      if (issueDetected) response.matchStrategy = response.matchStrategy || "intent-map";

      // If KB says no result, return helpful fallback instead of raw "not found"
      if (!response?.found) {
        const fallback = {
          id: `b-fallback-${Date.now()}`,
          type: "bot",
          content: {
            found: false,
            error: "Hmm, I'm not sure I understand.",
            solution: [
              "Can you try rephrasing your issue or provide more details? (device, app, exact error message)",
              "Examples: 'WiFi not working', 'Outlook shows an error when opening', '404 when visiting mysite.com/page'"
            ]
          },
          timestamp: new Date().toISOString(),
          confidence: response.confidence ?? 0,
          matchStrategy: response.matchStrategy ?? "kb"
        };
        setMessages(prev => [...prev, fallback]);
      } else {
        const botMessage = {
          id: `b-${Date.now()}`,
          type: "bot",
          content: response,
          timestamp: new Date().toISOString(),
          confidence: response.confidence ?? null,
          matchStrategy: response.matchStrategy ?? (issueDetected ? "intent-map" : "kb")
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (err) {
      console.error("Error calling API:", err);
      const errorMessage = {
        id: `b-error-${Date.now()}`,
        type: "bot",
        content: {
          found: false,
          error: "Service Error",
          solution: [
            "Unable to reach the troubleshooting service.",
            "Please check your internet connection or contact IT support at support@company.com",
            `Details: ${err?.message ?? "unknown"}`
          ]
        },
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="chat-container">
        <div style={{ padding: 20, textAlign: "center", color: "#666" }}>Loading Troubleshoot AI...</div>
      </div>
    );
  }

  return (
    <div className="chat-container" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div className="chat-header" style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="title-icon"><BotIcon /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18 }}>Troubleshoot AI</h1>
            <div style={{ fontSize: 12, color: "#666" }}>Internal IT Support Assistant</div>
          </div>
        </div>
      </div>

      <div
        className="messages-container"
        ref={containerRef}
        style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 12 }}
      >
        {messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg.content}
            isUser={msg.type === "user"}
            timestamp={msg.timestamp}
            confidence={msg.confidence}
            matchStrategy={msg.matchStrategy}
            isExpanded={expandedSolutions.has(msg.id)}
            onToggleSolution={() => toggleSolutionExpansion(msg.id)}
          />
        ))}

        {isTyping && (
          <div className="typing-indicator-message" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="typing-avatar"> </div>
            <div>
              <div style={{ fontSize: 13, color: "#333" }}>Analyzing your issue</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <div className="dot" style={{ width: 6, height: 6, borderRadius: 6, background: "#888", animation: "blink 1s infinite" }} />
                <div className="dot" style={{ width: 6, height: 6, borderRadius: 6, background: "#888", animation: "blink 1s .2s infinite" }} />
                <div className="dot" style={{ width: 6, height: 6, borderRadius: 6, background: "#888", animation: "blink 1s .4s infinite" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={{ borderTop: "1px solid #eee", padding: 12 }}>
        <Input onSendMessage={handleSendMessage} disabled={isTyping} isTyping={isTyping} />
      </div>
    </div>
  );
};

export default Chat;
