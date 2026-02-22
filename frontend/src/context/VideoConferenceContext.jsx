import React, { createContext, useContext, useState, useRef } from "react";

const VideoConferenceContext = createContext(null);

export function VideoConferenceProvider({ children }) {
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState("idle"); // idle | connecting | waiting | joined | rejected
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  // -----------------------------------------------
  // Request to join — backend decides if host or waiting
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
        setConnectionDetails({ token: data.token, serverUrl: data.livekitUrl });
        setMeetingStatus("joined");
      } else if (data.status === "waiting") {
        setMeetingStatus("waiting");
        startPolling(room, name);
      } else if (data.status === "rejected") {
        setMeetingStatus("rejected");
      }
    } catch (err) {
      setError("Could not connect. Please try again.");
      setMeetingStatus("idle");
    }
  }

  // -----------------------------------------------
  // Poll backend every 2 seconds while waiting
  // -----------------------------------------------
  function startPolling(room, name) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/waiting-status?roomName=${encodeURIComponent(room)}&participantName=${encodeURIComponent(name)}`
        );
        const data = await res.json();

        if (data.status === "joined") {
          stopPolling();
          setIsHost(false);
          setConnectionDetails({ token: data.token, serverUrl: data.livekitUrl });
          setMeetingStatus("joined");
        } else if (data.status === "rejected") {
          stopPolling();
          setMeetingStatus("rejected");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // -----------------------------------------------
  // Leave room
  // -----------------------------------------------
  async function leaveRoom() {
    stopPolling();
    if (isHost && roomName) {
      await fetch("/api/room-ended", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName }),
      }).catch(() => {});
    }
    setConnectionDetails(null);
    setRoomName("");
    setParticipantName("");
    setIsHost(false);
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
        meetingStatus,
        isConnecting: meetingStatus === "connecting",
        error,
        joinRoom,
        leaveRoom,
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
