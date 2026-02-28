import React from "react";
import { useVideoConference } from "../context/VideoConferenceContext";
import "../styles/WaitingRoomPanel.css";

// WaitingRoomPanel no longer polls — it reads waitingList directly from context.
// The server pushes "waiting-update" SSE events to the host/co-hosts whenever
// the waiting list changes, so this panel updates instantly.

function WaitingRoomPanel() {
  const { roomName, waitingList } = useVideoConference();

  async function admit(participantName) {
    await fetch("/api/admit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, participantName }),
    });
    // No local state update needed — server pushes a waiting-update event
    // which updates context.waitingList, which re-renders this panel
  }

  async function reject(participantName) {
    await fetch("/api/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, participantName }),
    });
  }

  async function admitAll() {
    for (const name of waitingList) {
      await admit(name);
    }
  }

  if (waitingList.length === 0) return null;

  return (
    <div className="waiting-panel">
      <div className="waiting-panel-header">
        <span className="waiting-panel-title">
          🚪 Waiting Room
          <span className="waiting-panel-count">{waitingList.length}</span>
        </span>
        {waitingList.length > 1 && (
          <button className="admit-all-btn" onClick={admitAll}>
            Admit All
          </button>
        )}
      </div>

      <div className="waiting-panel-list">
        {waitingList.map((name) => (
          <div key={name} className="waiting-panel-item">
            <div className="waiting-panel-avatar">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="waiting-panel-name">{name}</span>
            <div className="waiting-panel-actions">
              <button className="admit-btn" onClick={() => admit(name)}>
                Admit
              </button>
              <button className="reject-btn" onClick={() => reject(name)}>
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WaitingRoomPanel;
