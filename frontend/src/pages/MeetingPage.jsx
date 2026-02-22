import React, { useState } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";

import { useVideoConference } from "../context/VideoConferenceContext";
import VideoGrid from "../components/VideoGrid";
import Controls from "../components/Controls";
import ChatPanel from "../components/ChatPanel";
import ParticipantList from "../components/ParticipantList";
import WaitingRoomPanel from "../components/WaitingRoomPanel";
import PreJoinModal from "../components/PreJoinModal";
import "../styles/MeetingPage.css";

function MeetingRoom({ onLeave }) {
  const { roomName, participantName, isHost } = useVideoConference();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // Close other panel when opening one
  function toggleChat() {
    setIsChatOpen((prev) => !prev);
    setIsParticipantsOpen(false);
  }

  function toggleParticipants() {
    setIsParticipantsOpen((prev) => !prev);
    setIsChatOpen(false);
  }

  const isSidebarOpen = isChatOpen || isParticipantsOpen;

  return (
    <div className="meeting-container">
      {/* Top bar */}
      <div className="meeting-topbar">
        <div className="meeting-info">
          <span className="meeting-room-name">📹 {roomName}</span>
          <span className="meeting-participant-name">
            {participantName} {isHost && <span className="host-badge">Host</span>}
          </span>
        </div>
        <div className="meeting-timer">
          <MeetingTimer />
        </div>
      </div>

      {/* Host: waiting room admission panel (floating) */}
      {isHost && <WaitingRoomPanel />}

      {/* Main area */}
      <div className="meeting-main">
        <div className={`meeting-video-area ${isSidebarOpen ? "meeting-video-area--with-sidebar" : ""}`}>
          <VideoGrid />
        </div>

        {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} />}
        {isParticipantsOpen && <ParticipantList onClose={() => setIsParticipantsOpen(false)} />}
      </div>

      <RoomAudioRenderer />

      <Controls
        onToggleChat={toggleChat}
        isChatOpen={isChatOpen}
        onToggleParticipants={toggleParticipants}
        isParticipantsOpen={isParticipantsOpen}
        onLeave={onLeave}
      />
    </div>
  );
}

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

function MeetingPage() {
  const { connectionDetails, leaveRoom } = useVideoConference();
  // null = pre-join modal showing; object = user clicked Join with their prefs
  const [devicePrefs, setDevicePrefs] = useState(null);

  if (!connectionDetails) return null;

  // Show pre-join modal until the user clicks "Join Now"
  if (!devicePrefs) {
    return (
      <PreJoinModal
        onJoin={(prefs) => setDevicePrefs(prefs)}
      />
    );
  }

  return (
    <LiveKitRoom
      serverUrl={connectionDetails.serverUrl}
      token={connectionDetails.token}
      connect={true}
      video={devicePrefs.cameraEnabled}
      audio={devicePrefs.micEnabled}
      onDisconnected={leaveRoom}
      className="livekit-room-wrapper"
    >
      <MeetingRoom onLeave={leaveRoom} />
    </LiveKitRoom>
  );
}

export default MeetingPage;
