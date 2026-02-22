/**
 * Controls
 * -----------------------------------------------
 * Bottom bar with mic, camera, screen share, chat, leave buttons.
 * Screen share button opens ShareMenu — supports multiple simultaneous shares.
 */

import React, { useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { useScreenShares } from "../hooks/useScreenShares";
import { useVideoConference } from "../context/VideoConferenceContext";
import ShareMenu from "./ShareMenu";
import "../styles/Controls.css";

function Controls({
  onToggleChat,
  isChatOpen,
  onLeave,
  onToggleParticipants,
  isParticipantsOpen,
}) {
  const { localParticipant } = useLocalParticipant();
  const { shares } = useScreenShares();
  const { roomName } = useVideoConference();
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [screenShareError, setScreenShareError] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  function copyMeetingLink() {
    const link = `${window.location.origin}/room/${encodeURIComponent(roomName)}`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  const isMicEnabled = localParticipant?.isMicrophoneEnabled;
  const isCameraEnabled = localParticipant?.isCameraEnabled;
  const isSharing = shares.length > 0;

  function toggleMic() {
    localParticipant?.setMicrophoneEnabled(!isMicEnabled);
  }

  function toggleCamera() {
    localParticipant?.setCameraEnabled(!isCameraEnabled);
  }

  return (
    <div className="controls-wrapper">
      {/* Error toast */}
      {screenShareError && (
        <div className="screen-share-error">{screenShareError}</div>
      )}

      {/* Share menu popup */}
      {isShareMenuOpen && (
        <ShareMenu
          onClose={() => setIsShareMenuOpen(false)}
          onError={(msg) => {
            setScreenShareError(msg);
            setTimeout(() => setScreenShareError(null), 3000);
          }}
        />
      )}

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

        {/* Screen Share — opens ShareMenu */}
        <button
          className={`control-btn ${isSharing ? "control-btn--active control-btn--sharing" : ""} ${isShareMenuOpen ? "control-btn--active" : ""}`}
          onClick={() => setIsShareMenuOpen((prev) => !prev)}
          title="Share Screen"
        >
          <span className="control-icon">🖥️</span>
          <span className="control-label">
            {isSharing ? `Sharing (${shares.length})` : "Share"}
          </span>
          {isSharing && <span className="sharing-dot" />}
        </button>

        {/* Participants */}
        <button
          className={`control-btn ${isParticipantsOpen ? "control-btn--active" : ""}`}
          onClick={onToggleParticipants}
          title="Participants"
        >
          <span className="control-icon">👥</span>
          <span className="control-label">Participants</span>
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

        {/* Copy Link */}
        <button
          className={`control-btn ${linkCopied ? "control-btn--copied" : ""}`}
          onClick={copyMeetingLink}
          title="Copy meeting link"
        >
          <span className="control-icon">{linkCopied ? "✅" : "🔗"}</span>
          <span className="control-label">{linkCopied ? "Copied!" : "Copy Link"}</span>
        </button>

        {/* Leave */}
        <button className="control-btn control-btn--leave" onClick={onLeave} title="Leave Meeting">
          <span className="control-icon">📴</span>
          <span className="control-label">Leave</span>
        </button>
      </div>
    </div>
  );
}

export default Controls;
