/**
 * App.jsx
 * -----------------------------------------------
 * Root component. Shows LobbyPage when not connected,
 * MeetingPage when connected. Simple and clean.
 */

import React from "react";
import { VideoConferenceProvider, useVideoConference } from "./context/VideoConferenceContext";
import LobbyPage from "./pages/LobbyPage";
import MeetingPage from "./pages/MeetingPage";

function AppRouter() {
  const { connectionDetails } = useVideoConference();

  // Show meeting room if connected, otherwise show lobby
  return connectionDetails ? <MeetingPage /> : <LobbyPage />;
}

function App() {
  return (
    <VideoConferenceProvider>
      <AppRouter />
    </VideoConferenceProvider>
  );
}

export default App;
