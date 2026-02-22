import React, { useState } from "react";
import { useVideoConference } from "../context/VideoConferenceContext";
import "../styles/LobbyPage.css";

function getRoomFromURL() {
  // Support /room/my-room-name or ?room=my-room-name
  const pathMatch = window.location.pathname.match(/^\/room\/(.+)/);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);
  const params = new URLSearchParams(window.location.search);
  if (params.get("room")) return params.get("room");
  return "";
}

function LobbyPage() {
  const { joinRoom, isConnecting, error } = useVideoConference();
  const [roomName, setRoomName] = useState(getRoomFromURL);
  const [participantName, setParticipantName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!roomName.trim() || !participantName.trim()) return;
    joinRoom(roomName.trim(), participantName.trim());
  }

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        {/* Logo / Branding */}
        <div className="lobby-logo">
          <div className="logo-icon">📹</div>
          <h1 className="lobby-title">VideoConf</h1>
          <p className="lobby-subtitle">HD video meetings for everyone</p>
        </div>

        {/* Join Form */}
        <form className="lobby-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="participantName">Your Name</label>
            <input
              id="participantName"
              type="text"
              placeholder="Enter your display name"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              disabled={isConnecting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomName">Room Name</label>
            <input
              id="roomName"
              type="text"
              placeholder="Enter a room name or code"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              disabled={isConnecting}
            />
          </div>

          {error && <div className="lobby-error">{error}</div>}

          <button
            type="submit"
            className="join-button"
            disabled={isConnecting || !roomName.trim() || !participantName.trim()}
          >
            {isConnecting ? (
              <span className="spinner-text">⏳ Connecting...</span>
            ) : (
              "Join Meeting"
            )}
          </button>
        </form>

        {roomName.trim() ? (
          <p className="lobby-hint">
            Share this link to invite others:{" "}
            <span
              className="lobby-share-link"
              onClick={() => {
                const link = `${window.location.origin}/room/${encodeURIComponent(roomName.trim())}`;
                navigator.clipboard.writeText(link);
              }}
              title="Click to copy"
            >
              {window.location.origin}/room/{encodeURIComponent(roomName.trim())}
            </span>
            <span className="lobby-copy-hint"> (click to copy)</span>
          </p>
        ) : (
          <p className="lobby-hint">
            Enter a room name to get a shareable link
          </p>
        )}
      </div>
    </div>
  );
}

export default LobbyPage;
