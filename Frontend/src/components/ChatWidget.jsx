import React, { useState } from "react";
import { FiSend } from "react-icons/fi";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "नमस्ते! 😊 मैं आपकी वर्चुअल असिस्टेंट हूँ। How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const chatInput = input;
      const result = await model.generateContent(chatInput);
      const reply = result.response.text() || "माफ़ कीजिए, मैं अभी जवाब नहीं दे पाई 😞";

      setMessages([...newMessages, { sender: "bot", text: reply }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...newMessages,
        { sender: "bot", text: "Sorry, I couldn’t respond right now 😞" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
 <>
  {/* Floating Chat Icon */}
  <div style={styles.chatIcon} onClick={toggleChat}>
    <div style={styles.chatIconInner}>
      <img
        src="https://cdn-icons-png.flaticon.com/512/4712/4712100.png"
        alt="Chat Icon"
        style={styles.chatIconImage}
      />
      {!isOpen && <div style={styles.pulseAnimation}></div>}
    </div>
  </div>

  {/* Chat Window */}
  {isOpen && (
    <div style={styles.chatWindow}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.avatar}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712100.png"
              alt="bot"
              style={styles.avatarImage}
            />
            <div style={styles.statusIndicator}></div>
          </div>
          <div style={styles.headerText}>
            <strong style={styles.botName}>AI Assistant</strong>
            <div style={styles.botStatus}>Online • Ready to help</div>
          </div>
          <button style={styles.closeButton} onClick={toggleChat}>
            ×
          </button>
        </div>
      </div>

      <div style={styles.messagesContainer}>
        <div style={styles.welcomeMessage}>
          <div style={styles.welcomeAvatar}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712100.png"
              alt="bot"
              style={styles.welcomeAvatarImage}
            />
          </div>
          <div style={styles.welcomeText}>
            <strong>Hello! 👋</strong>
            <p>I'm your AI assistant. How can I help you today?</p>
          </div>
        </div>

        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.messageBubble,
                ...(msg.sender === "user" ? styles.userMessage : styles.botMessage),
              }}
            >
              <div style={styles.messageContent}>
                {msg.text}
              </div>
              <div style={styles.messageTime}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.typingIndicator}>
              <div style={styles.typingAvatar}>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/4712/4712100.png"
                  alt="bot"
                  style={styles.typingAvatarImage}
                />
              </div>
              <div style={styles.typingContent}>
                <div style={styles.typingText}>AI Assistant is typing</div>
                <div style={styles.typingDots}>
                  <span style={styles.typingDot}></span>
                  <span style={styles.typingDot}></span>
                  <span style={styles.typingDot}></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.inputContainer}>
        <div style={styles.inputWrapper}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button 
            style={styles.sendButton} 
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            <svg style={styles.sendIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <div style={styles.footer}>
          <div style={styles.footerText}>AI-powered responses</div>
        </div>
      </div>
    </div>
  )}
</>
  );
};

const styles = {
  chatIcon: {
    position: "fixed",
    bottom: 20,
    right: 20,
    cursor: "pointer",
    zIndex: 999,
    '@media (max-width: 768px)': {
      bottom: 15,
      right: 15,
    }
  },
  chatIconInner: {
    position: "relative",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "50%",
    padding: "12px",
    boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)",
    transition: "all 0.3s ease",
    ':hover': {
      transform: "scale(1.1)",
      boxShadow: "0 12px 35px rgba(102, 126, 234, 0.6)",
    }
  },
  chatIconImage: {
    width: 35,
    height: 35,
    filter: "brightness(0) invert(1)",
  },
  pulseAnimation: {
    position: "absolute",
    top: "-5px",
    left: "-5px",
    right: "-5px",
    bottom: "-5px",
    border: "2px solid #667eea",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  
  chatWindow: {
    position: "fixed",
    bottom: 80,
    right: 20,
    width: 380,
    height: 600,
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    zIndex: 1000,
    overflow: "hidden",
    border: "1px solid #f0f0f0",
    '@media (max-width: 768px)': {
      width: "calc(100vw - 40px)",
      height: "70vh",
      bottom: 70,
      right: 20,
      left: 20,
    }
  },
  
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "16px 20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    position: "relative",
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#fff",
    padding: 4,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "#4ade80",
    border: "2px solid #fff",
  },
  headerText: {
    flex: 1,
    color: "#fff",
  },
  botName: {
    fontSize: "16px",
    display: "block",
  },
  botStatus: {
    fontSize: "12px",
    opacity: 0.9,
    marginTop: 2,
  },
  closeButton: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "#fff",
    fontSize: "20px",
    width: 32,
    height: 32,
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    ':hover': {
      background: "rgba(255,255,255,0.3)",
    }
  },
  
  messagesContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#f8fafc",
    overflow: "hidden",
  },
  welcomeMessage: {
    display: "flex",
    alignItems: "flex-start",
    padding: "20px",
    gap: 12,
    background: "#fff",
    margin: 12,
    marginBottom: 8,
    borderRadius: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  welcomeAvatar: {
    flexShrink: 0,
  },
  welcomeAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: "50%",
  },
  welcomeText: {
    flex: 1,
    fontSize: "14px",
    color: "#374151",
  },
  
  messages: {
    flex: 1,
    padding: "12px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  messageBubble: {
    maxWidth: "85%",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  userMessage: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  botMessage: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageContent: {
    padding: "12px 16px",
    borderRadius: "18px",
    fontSize: "14px",
    lineHeight: 1.4,
    wordWrap: "break-word",
  },
  userMessageContent: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    borderBottomRightRadius: 6,
  },
  botMessageContent: {
    background: "#fff",
    color: "#374151",
    border: "1px solid #e5e7eb",
    borderBottomLeftRadius: 6,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  messageTime: {
    fontSize: "11px",
    color: "#9ca3af",
    padding: "0 8px",
  },
  
  typingIndicator: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "8px 12px",
  },
  typingAvatar: {
    flexShrink: 0,
  },
  typingAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: "50%",
  },
  typingContent: {
    background: "#fff",
    padding: "12px 16px",
    borderRadius: "18px",
    borderBottomLeftRadius: 6,
    border: "1px solid #e5e7eb",
  },
  typingText: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: 4,
  },
  typingDots: {
    display: "flex",
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#9ca3af",
    animation: "typing 1.4s infinite ease-in-out",
    ':nth-child(1)': { animationDelay: "0s" },
    ':nth-child(2)': { animationDelay: "0.2s" },
    ':nth-child(3)': { animationDelay: "0.4s" },
  },
  
  inputContainer: {
    background: "#fff",
    borderTop: "1px solid #f0f0f0",
    padding: "16px",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#f8fafc",
    borderRadius: "24px",
    padding: "4px",
    border: "1px solid #e5e7eb",
    transition: "all 0.2s ease",
    ':focus-within': {
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
    }
  },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "12px 16px",
    outline: "none",
    fontSize: "14px",
    color: "#374151",
    '::placeholder': {
      color: "#9ca3af",
    }
  },
  sendButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    color: "#fff",
    width: 40,
    height: 40,
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    ':hover:not(:disabled)': {
      transform: "scale(1.05)",
      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
    },
    ':disabled': {
      opacity: 0.5,
      cursor: "not-allowed",
    }
  },
  sendIcon: {
    width: 20,
    height: 20,
  },
  footer: {
    textAlign: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: "11px",
    color: "#9ca3af",
  },
};

// Add these CSS animations to your global styles
const globalStyles = `
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .chat-window {
    width: calc(100vw - 40px) !important;
    height: 70vh !important;
    bottom: 70px !important;
    right: 20px !important;
    left: 20px !important;
  }
}
`;

export default ChatWidget;
