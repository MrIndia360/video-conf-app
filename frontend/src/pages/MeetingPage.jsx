/**
 * MeetingPage
 * -----------------------------------------------
 * The main meeting room. Connects to LiveKit,
 * renders the video grid, controls, and chat panel.
 */

import React, { useState, useCallback } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";

import { useVideoConference } from "../context/VideoConferenceContext";
import VideoGrid from "../components/VideoGrid";
import Controls from "../components/Controls";
import ChatPanel from "../components/ChatPanel";
import "../styles/MeetingPage.css";

function MeetingRoom({ onLeave }) {
  const { roomName, participantName } = useVideoConference();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Screen share handled via LiveKit participant API
  // We pass handlers down to Controls
  const handleToggleScreenShare = useCallback(async () => {
    // Screen share is toggled directly in Controls via localParticipant
    setIsScreenSharing((prev) => !prev);
  }, []);

  return (
    <div className="meeting-container">
      {/* Top bar */}
      <div className="meeting-topbar">
        <div className="meeting-info">
          <span className="meeting-room-name">📹 {roomName}</span>
          <span className="meeting-participant-name">You: {participantName}</span>
        </div>
        <div className="meeting-timer">
          <MeetingTimer />
        </div>
      </div>

      {/* Main area: video grid + chat */}
      <div className="meeting-main">
        <div className={`meeting-video-area ${isChatOpen ? "meeting-video-area--with-chat" : ""}`}>
          <VideoGrid />
        </div>

        {isChatOpen && (
          <ChatPanel onClose={() => setIsChatOpen(false)} />
        )}
      </div>

      {/* Audio renderer (invisible — plays remote audio) */}
      <RoomAudioRenderer />

      {/* Bottom controls */}
      <Controls
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        isChatOpen={isChatOpen}
        onLeave={onLeave}
        onToggleScreenShare={handleToggleScreenShare}
        isScreenSharing={isScreenSharing}
      />
    </div>
  );
}

// Simple meeting duration timer
function MeetingTimer() {
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const hrs = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return <span className="timer">{hrs}:{mins}:{secs}</span>;
}

// Wrapper that provides LiveKitRoom context
function MeetingPage() {
  const { connectionDetails, leaveRoom } = useVideoConference();

  if (!connectionDetails) return null;

  return (
    <LiveKitRoom
      serverUrl={connectionDetails.serverUrl}
      token={connectionDetails.token}
      connect={true}
      video={true}
      audio={true}
      onDisconnected={leaveRoom}
      className="livekit-room-wrapper"
    >
      <MeetingRoom onLeave={leaveRoom} />
    </LiveKitRoom>
  );
}

export default MeetingPage;
