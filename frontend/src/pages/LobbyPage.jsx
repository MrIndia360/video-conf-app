import React, { useState } from "react";
import { useVideoConference } from "../context/VideoConferenceContext";
import "../styles/LobbyPage.css";

function LobbyPage() {
  const { joinRoom, isConnecting, error } = useVideoConference();
  const [roomName, setRoomName] = useState("");
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

        <p className="lobby-hint">
          Share the room name with others to invite them
        </p>
      </div>
    </div>
  );
}

export default LobbyPage;
