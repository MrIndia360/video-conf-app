import React from "react";
import { VideoConferenceProvider, useVideoConference } from "./context/VideoConferenceContext";
import LobbyPage from "./pages/LobbyPage";
import MeetingPage from "./pages/MeetingPage";
import WaitingPage from "./pages/WaitingPage";

function AppRouter() {
  const { meetingStatus } = useVideoConference();

  if (meetingStatus === "joined") return <MeetingPage />;
  if (meetingStatus === "waiting" || meetingStatus === "rejected") return <WaitingPage />;
  return <LobbyPage />;
}

function App() {
  return (
    <VideoConferenceProvider>
      <AppRouter />
    </VideoConferenceProvider>
  );
}

export default App;
