/**
 * VideoGrid
 * -----------------------------------------------
 * Two layouts:
 * 1. Grid layout  — nobody is screen sharing (default)
 * 2. Featured layout — active screen share(s) + camera thumbnails
 *    Supports multiple simultaneous shares via tabs at top
 */

import React, { useState, useEffect } from "react";
import {
  ParticipantTile,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "../styles/VideoGrid.css";

// Returns CSS grid-template-columns value for N participants
function getGridColumns(count) {
  if (count <= 1) return "1fr";
  if (count <= 2) return "1fr 1fr";
  if (count <= 4) return "1fr 1fr";
  if (count <= 6) return "1fr 1fr 1fr";
  return "1fr 1fr 1fr 1fr";
}

function VideoGrid() {
  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }]
  );

  const screenShareTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }]
  );

  const [activeShareIndex, setActiveShareIndex] = useState(0);

  // If active share is removed, reset to first
  useEffect(() => {
    if (activeShareIndex >= screenShareTracks.length) {
      setActiveShareIndex(0);
    }
  }, [screenShareTracks.length, activeShareIndex]);

  const isScreenSharing = screenShareTracks.length > 0;

  // -----------------------------------------------
  // Featured layout — one or more screen shares active
  // -----------------------------------------------
  if (isScreenSharing) {
    const activeTrack = screenShareTracks[activeShareIndex] || screenShareTracks[0];
    const sharerName = activeTrack?.participant?.identity || "Someone";

    return (
      <div className="video-grid-container">

        {/* Multiple shares — tab switcher */}
        {screenShareTracks.length > 1 && (
          <div className="share-tabs">
            {screenShareTracks.map((track, i) => (
              <button
                key={track.participant.identity}
                className={`share-tab ${i === activeShareIndex ? "share-tab--active" : ""}`}
                onClick={() => setActiveShareIndex(i)}
              >
                🖥️ {track.participant?.identity}'s screen
              </button>
            ))}
          </div>
        )}

        {/* Single share — simple banner */}
        {screenShareTracks.length === 1 && (
          <div className="screen-share-banner">
            🖥️ <strong>{sharerName}</strong> is sharing their screen
          </div>
        )}

        <div className="featured-layout">
          {/* Large screen share view */}
          <div className="featured-main">
            <VideoTrack trackRef={activeTrack} className="featured-screen" />
            <div className="featured-label">{sharerName}'s screen</div>
          </div>

          {/* Camera thumbnails on the right */}
          <div className="featured-thumbnails">
            {cameraTracks.map((track) => (
              <div key={track.participant.identity} className="thumbnail-tile">
                <ParticipantTile trackRef={track} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------
  // Default grid layout — no screen sharing
  // -----------------------------------------------
  const columns = getGridColumns(cameraTracks.length);

  return (
    <div className="video-grid-container">
      <div
        className="video-grid"
        style={{ gridTemplateColumns: columns }}
      >
        {cameraTracks.map((track) => {
          const key = `${track.participant.identity}-${track.source}`;
          return (
            <div key={key} className="video-tile">
              <ParticipantTile trackRef={track} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VideoGrid;
