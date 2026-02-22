/**
 * ChatPanel
 * -----------------------------------------------
 * In-meeting text chat using LiveKit's Data Channel.
 * No extra server needed — messages go through LiveKit's SFU.
 */

import React, { useState, useEffect, useRef } from "react";
import { useDataChannel, useLocalParticipant } from "@livekit/components-react";
import "../styles/ChatPanel.css";

function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const { localParticipant } = useLocalParticipant();

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Send a chat message via LiveKit Data Channel
  const { send } = useDataChannel("chat", (msg) => {
    try {
      const parsed = JSON.parse(decoder.decode(msg.payload));
      setMessages((prev) => [...prev, parsed]);
    } catch (e) {
      console.error("Failed to parse chat message", e);
    }
  });

  function sendMessage(e) {
    e.preventDefault();
    if (!inputText.trim()) return;

    const message = {
      id: Date.now(),
      sender: localParticipant?.identity || "You",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSelf: true,
    };

    // Send to all participants
    send(encoder.encode(JSON.stringify({ ...message, isSelf: false })), { reliable: true });

    // Add to own messages immediately
    setMessages((prev) => [...prev, message]);
    setInputText("");
  }

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span>Meeting Chat</span>
        <button className="chat-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">No messages yet. Say hello! 👋</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.isSelf ? "chat-message--self" : "chat-message--other"}`}
          >
            {!msg.isSelf && <div className="chat-sender">{msg.sender}</div>}
            <div className="chat-bubble">{msg.text}</div>
            <div className="chat-time">{msg.timestamp}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn" disabled={!inputText.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}

export default ChatPanel;
