/**
 * VideoGrid
 * -----------------------------------------------
 * Renders a responsive grid of participant video tiles.
 * Uses LiveKit's GridLayout + VideoTrack components.
 */

import React from "react";
import {
  GridLayout,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "../styles/VideoGrid.css";

function VideoGrid() {
  // Subscribe to all camera and screen share tracks in the room
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="video-grid-container">
      <GridLayout tracks={tracks} className="video-grid">
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}

export default VideoGrid;
