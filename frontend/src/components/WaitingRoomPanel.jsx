import React, { useState, useEffect } from "react";
import { useVideoConference } from "../context/VideoConferenceContext";
import "../styles/WaitingRoomPanel.css";

function WaitingRoomPanel() {
  const { roomName } = useVideoConference();
  const [waitingList, setWaitingList] = useState([]);

  // Poll waiting list every 3 seconds
  useEffect(() => {
    fetchWaitingList();
    const interval = setInterval(fetchWaitingList, 3000);
    return () => clearInterval(interval);
  }, [roomName]);

  async function fetchWaitingList() {
    try {
      const res = await fetch(`/api/waiting-list?roomName=${encodeURIComponent(roomName)}`);
      const data = await res.json();
      setWaitingList(data.waiting || []);
    } catch (err) {
      console.error("Failed to fetch waiting list", err);
    }
  }

  async function admit(participantName) {
    await fetch("/api/admit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, participantName }),
    });
    setWaitingList((prev) => prev.filter((p) => p !== participantName));
  }

  async function reject(participantName) {
    await fetch("/api/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, participantName }),
    });
    setWaitingList((prev) => prev.filter((p) => p !== participantName));
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
