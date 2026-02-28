import React from "react";
import { useParticipants, useLocalParticipant } from "@livekit/components-react";
import { useVideoConference } from "../context/VideoConferenceContext";
import "../styles/ParticipantList.css";

function ParticipantList({ onClose }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { isHost, hostIdentity, coHosts, promoteToCoHost, removeCoHost } = useVideoConference();

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
          // Anyone whose identity matches hostIdentity is the host
          const isParticipantHost = participant.identity === hostIdentity;
          const isCoHost = coHosts.includes(participant.identity);

          // Host can promote any non-host, non-co-host participant (not themselves)
          const canPromote = isHost && !isLocal && !isParticipantHost && !isCoHost;
          // Host can remove an existing co-host
          const canDemote = isHost && !isLocal && isCoHost;

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
                  {!isParticipantHost && isCoHost && (
                    <span className="badge badge--cohost">Co-host</span>
                  )}
                </span>

                {/* Make Co-Host button — visible to host for non-co-host participants */}
                {canPromote && (
                  <button
                    className="cohost-btn"
                    onClick={() => promoteToCoHost(participant.identity)}
                    title={`Make ${participant.identity} a co-host`}
                  >
                    Make Co-Host
                  </button>
                )}

                {/* Remove Co-Host button — visible to host for existing co-hosts */}
                {canDemote && (
                  <button
                    className="cohost-btn cohost-btn--remove"
                    onClick={() => removeCoHost(participant.identity)}
                    title={`Remove ${participant.identity} as co-host`}
                  >
                    Remove Co-Host
                  </button>
                )}
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
