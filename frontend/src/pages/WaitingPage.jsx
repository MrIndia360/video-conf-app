import React from "react";
import { useVideoConference } from "../context/VideoConferenceContext";
import "../styles/WaitingPage.css";

function WaitingPage() {
  const { roomName, participantName, meetingStatus, leaveRoom } = useVideoConference();

  const isRejected = meetingStatus === "rejected";

  return (
    <div className="waiting-container">
      <div className="waiting-card">
        {isRejected ? (
          <>
            <div className="waiting-icon">🚫</div>
            <h2 className="waiting-title">Entry Denied</h2>
            <p className="waiting-subtitle">
              The host did not admit you to <strong>{roomName}</strong>.
            </p>
            <button className="waiting-leave-btn" onClick={leaveRoom}>
              Back to Lobby
            </button>
          </>
        ) : (
          <>
            {/* Animated waiting indicator */}
            <div className="waiting-spinner">
              <div className="spinner-dot" />
              <div className="spinner-dot" />
              <div className="spinner-dot" />
            </div>

            <h2 className="waiting-title">Waiting to be admitted</h2>
            <p className="waiting-subtitle">
              Please wait — the host will let you into <strong>{roomName}</strong> shortly.
            </p>

            <div className="waiting-info">
              <span className="waiting-name-badge">👤 {participantName}</span>
            </div>

            <button className="waiting-leave-btn" onClick={leaveRoom}>
              Leave
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default WaitingPage;
