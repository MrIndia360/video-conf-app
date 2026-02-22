import React from "react";
import { useParticipants, useLocalParticipant } from "@livekit/components-react";
import { useVideoConference } from "../context/VideoConferenceContext";
import "../styles/ParticipantList.css";

function ParticipantList({ onClose }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { isHost } = useVideoConference();

  return (
    <div className="participant-list">
      <div className="participant-list-header">
        <span>
          Participants
          <span className="participant-count">{participants.length}</span>
        </span>
        <button className="participant-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="participant-list-body">
        {participants.map((participant) => {
          const isLocal = participant.identity === localParticipant?.identity;
          const isMicOn = participant.isMicrophoneEnabled;
          const isCamOn = participant.isCameraEnabled;
          const isSpeaking = participant.isSpeaking;
          const isParticipantHost = isHost && isLocal;

          return (
            <div
              key={participant.identity}
              className={`participant-item ${isSpeaking ? "participant-item--speaking" : ""}`}
            >
              {/* Avatar */}
              <div className="participant-avatar">
                {participant.identity.charAt(0).toUpperCase()}
                {isSpeaking && <span className="speaking-ring" />}
              </div>

              {/* Name + badges */}
              <div className="participant-info">
                <span className="participant-name">
                  {participant.identity}
                  {isLocal && <span className="badge badge--you">You</span>}
                  {isParticipantHost && <span className="badge badge--host">Host</span>}
                </span>
              </div>

              {/* Status icons */}
              <div className="participant-status">
                <span title={isMicOn ? "Mic on" : "Muted"}>
                  {isMicOn ? "🎤" : "🔇"}
                </span>
                <span title={isCamOn ? "Camera on" : "Camera off"}>
                  {isCamOn ? "📷" : "📵"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ParticipantList;
