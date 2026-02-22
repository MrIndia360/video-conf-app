/**
 * Controls
 * -----------------------------------------------
 * Bottom bar with mic, camera, screen share, chat, leave buttons.
 * Uses LiveKit hooks under the hood but is fully styled by us.
 */

import React from "react";
import {
  useLocalParticipant,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "../styles/Controls.css";

function Controls({ onToggleChat, isChatOpen, onLeave, onToggleScreenShare, isScreenSharing }) {
  const { localParticipant } = useLocalParticipant();

  const isMicEnabled = localParticipant?.isMicrophoneEnabled;
  const isCameraEnabled = localParticipant?.isCameraEnabled;

  function toggleMic() {
    localParticipant?.setMicrophoneEnabled(!isMicEnabled);
  }

  function toggleCamera() {
    localParticipant?.setCameraEnabled(!isCameraEnabled);
  }

  return (
    <div className="controls-bar">
      {/* Microphone */}
      <button
        className={`control-btn ${!isMicEnabled ? "control-btn--off" : ""}`}
        onClick={toggleMic}
        title={isMicEnabled ? "Mute" : "Unmute"}
      >
        <span className="control-icon">{isMicEnabled ? "🎤" : "🔇"}</span>
        <span className="control-label">{isMicEnabled ? "Mute" : "Unmute"}</span>
      </button>

      {/* Camera */}
      <button
        className={`control-btn ${!isCameraEnabled ? "control-btn--off" : ""}`}
        onClick={toggleCamera}
        title={isCameraEnabled ? "Stop Video" : "Start Video"}
      >
        <span className="control-icon">{isCameraEnabled ? "📷" : "📵"}</span>
        <span className="control-label">{isCameraEnabled ? "Stop Video" : "Start Video"}</span>
      </button>

      {/* Screen Share */}
      <button
        className={`control-btn ${isScreenSharing ? "control-btn--active" : ""}`}
        onClick={onToggleScreenShare}
        title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
      >
        <span className="control-icon">🖥️</span>
        <span className="control-label">{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
      </button>

      {/* Chat */}
      <button
        className={`control-btn ${isChatOpen ? "control-btn--active" : ""}`}
        onClick={onToggleChat}
        title="Chat"
      >
        <span className="control-icon">💬</span>
        <span className="control-label">Chat</span>
      </button>

      {/* Leave */}
      <button className="control-btn control-btn--leave" onClick={onLeave} title="Leave Meeting">
        <span className="control-icon">📴</span>
        <span className="control-label">Leave</span>
      </button>
    </div>
  );
}

export default Controls;
