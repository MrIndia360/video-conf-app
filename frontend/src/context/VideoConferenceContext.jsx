import React, { createContext, useContext, useState, useRef } from "react";

const VideoConferenceContext = createContext(null);

export function VideoConferenceProvider({ children }) {
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [hostIdentity, setHostIdentity] = useState(null);
  const [coHosts, setCoHosts] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [meetingStatus, setMeetingStatus] = useState("idle");
  const [error, setError] = useState(null);

  // Single SSE connection per session — replaces all polling
  const esRef = useRef(null);

  // We need stable refs to the latest name so SSE handlers
  // can compare without stale closures
  const nameRef = useRef("");

  // -----------------------------------------------
  // Open SSE connection right after request-join
  // Handles: role-update, admitted, rejected, waiting-update
  // -----------------------------------------------
  function startEventStream(room, name) {
    stopEventStream();
    nameRef.current = name;

    const url = `/api/room-stream?roomName=${encodeURIComponent(room)}&participantName=${encodeURIComponent(name)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = async (e) => {
      let payload;
      try { payload = JSON.parse(e.data); } catch { return; }

      if (payload.type === "role-update") {
        setHostIdentity(payload.hostIdentity || null);
        setCoHosts(payload.coHosts || []);
        // Detect if this participant has just become the host
        if (payload.hostIdentity === nameRef.current) {
          setIsHost(true);
        }
      }

      if (payload.type === "admitted") {
        stopEventStream();
        setIsHost(false);
        setConnectionDetails({ token: payload.token, serverUrl: payload.livekitUrl });
        setMeetingStatus("joined");
        // Re-open SSE so the now-joined participant still receives role updates
        startEventStream(room, name);
      }

      if (payload.type === "rejected") {
        stopEventStream();
        setMeetingStatus("rejected");
      }

      if (payload.type === "waiting-update") {
        setWaitingList(payload.waiting || []);
      }
    };

    es.onerror = () => {
      // Browser auto-reconnects EventSource — no manual retry needed
      console.warn("SSE connection interrupted, browser will retry...");
    };
  }

  function stopEventStream() {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }

  // -----------------------------------------------
  // Request to join — backend decides host or waiting
  // -----------------------------------------------
  async function joinRoom(room, name) {
    setMeetingStatus("connecting");
    setError(null);
    setRoomName(room);
    setParticipantName(name);

    try {
      const res = await fetch("/api/request-join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: room, participantName: name }),
      });
      const data = await res.json();

      if (data.status === "joined") {
        setIsHost(data.isHost);
        if (data.isHost) setHostIdentity(name);
        setConnectionDetails({ token: data.token, serverUrl: data.livekitUrl });
        setMeetingStatus("joined");
        // Open SSE to receive role changes and waiting-list updates
        startEventStream(room, name);
      } else if (data.status === "waiting") {
        setMeetingStatus("waiting");
        // Open SSE — will receive "admitted" or "rejected" when host acts
        startEventStream(room, name);
      } else if (data.status === "rejected") {
        setMeetingStatus("rejected");
      }
    } catch (err) {
      setError("Could not connect. Please try again.");
      setMeetingStatus("idle");
    }
  }

  // -----------------------------------------------
  // Promote a participant to co-host (host only)
  // -----------------------------------------------
  async function promoteToCoHost(targetName) {
    if (!roomName) return;
    try {
      await fetch("/api/promote-cohost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, participantName: targetName }),
      });
      // Server will push a role-update SSE event to all clients — no optimistic update needed
    } catch (err) {
      console.error("Failed to promote co-host:", err);
    }
  }

  // -----------------------------------------------
  // Remove a co-host (host only)
  // -----------------------------------------------
  async function removeCoHost(targetName) {
    if (!roomName) return;
    try {
      await fetch("/api/remove-cohost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, participantName: targetName }),
      });
      // Server will push a role-update SSE event to all clients
    } catch (err) {
      console.error("Failed to remove co-host:", err);
    }
  }

  // -----------------------------------------------
  // Leave room
  // -----------------------------------------------
  async function leaveRoom() {
    stopEventStream();

    if (roomName) {
      await fetch("/api/room-ended", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, participantName }),
      }).catch(() => {});
    }

    setConnectionDetails(null);
    setRoomName("");
    setParticipantName("");
    setIsHost(false);
    setHostIdentity(null);
    setCoHosts([]);
    setWaitingList([]);
    setMeetingStatus("idle");
    setError(null);
  }

  return (
    <VideoConferenceContext.Provider
      value={{
        connectionDetails,
        roomName,
        participantName,
        isHost,
        hostIdentity,
        coHosts,
        waitingList,
        meetingStatus,
        isConnecting: meetingStatus === "connecting",
        error,
        joinRoom,
        leaveRoom,
        promoteToCoHost,
        removeCoHost,
      }}
    >
      {children}
    </VideoConferenceContext.Provider>
  );
}

export function useVideoConference() {
  const ctx = useContext(VideoConferenceContext);
  if (!ctx) throw new Error("useVideoConference must be used inside VideoConferenceProvider");
  return ctx;
}
