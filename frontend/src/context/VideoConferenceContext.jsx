/**
 * VideoConferenceContext
 * -----------------------------------------------
 * Global state for the meeting session.
 * Components use this context to get tokens and
 * know who the current user is.
 *
 * This context talks only to the adapter — never
 * directly to LiveKit or any SDK.
 */

import React, { createContext, useContext, useState } from "react";
import videoProvider from "../config";

const VideoConferenceContext = createContext(null);

export function VideoConferenceProvider({ children }) {
  const [connectionDetails, setConnectionDetails] = useState(null); // { token, serverUrl }
  const [roomName, setRoomName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Called from LobbyPage when user clicks "Join"
   * Fetches a token via the adapter and stores connection details
   */
  async function joinRoom(room, name) {
    setIsConnecting(true);
    setError(null);

    try {
      const details = await videoProvider.getToken(room, name);
      setRoomName(room);
      setParticipantName(name);
      setConnectionDetails(details);
    } catch (err) {
      setError("Could not connect. Please check your credentials and try again.");
      console.error("Join error:", err);
    } finally {
      setIsConnecting(false);
    }
  }

  /**
   * Called when user leaves the meeting
   */
  function leaveRoom() {
    setConnectionDetails(null);
    setRoomName("");
    setParticipantName("");
    setError(null);
  }

  return (
    <VideoConferenceContext.Provider
      value={{
        connectionDetails,
        roomName,
        participantName,
        isConnecting,
        error,
        joinRoom,
        leaveRoom,
        providerName: videoProvider.getProviderName(),
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
