/**
 * PreJoinModal
 * -----------------------------------------------
 * Shown after token is received but BEFORE connecting
 * to LiveKit. Lets the user:
 *   - Preview their camera
 *   - Choose to enable/disable mic and camera
 *   - Click "Join Now" to enter the meeting
 *
 * Mic and camera are OFF by default.
 */

import React, { useState, useEffect, useRef } from "react";
import { useVideoConference } from "../context/VideoConferenceContext";
import "../styles/PreJoinModal.css";

function PreJoinModal({ onJoin }) {
  const { roomName, participantName } = useVideoConference();

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [micError, setMicError] = useState(null);
  const videoRef = useRef(null);

  // Start camera preview when user enables camera
  useEffect(() => {
    if (cameraEnabled) {
      startCameraPreview();
    } else {
      stopCameraPreview();
    }
    return () => stopCameraPreview();
  }, [cameraEnabled]);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  async function startCameraPreview() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
    } catch (err) {
      setCameraEnabled(false);
      setCameraError("Could not access camera. Check permissions.");
    }
  }

  function stopCameraPreview() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  }

  async function toggleMic() {
    setMicError(null);
    if (!micEnabled) {
      try {
        // Just test access — LiveKit will handle the actual mic stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop()); // release immediately
        setMicEnabled(true);
      } catch (err) {
        setMicError("Could not access microphone. Check permissions.");
      }
    } else {
      setMicEnabled(false);
    }
  }

  function handleJoin() {
    stopCameraPreview(); // release preview stream before LiveKit takes over
    onJoin({ cameraEnabled, micEnabled });
  }

  return (
    <div className="prejoin-overlay">
      <div className="prejoin-modal">

        {/* Header */}
        <div className="prejoin-header">
          <h2 className="prejoin-title">Ready to join?</h2>
          <p className="prejoin-subtitle">
            <span className="prejoin-room">📹 {roomName}</span>
            <span className="prejoin-name">as {participantName}</span>
          </p>
        </div>

        {/* Camera preview */}
        <div className="prejoin-preview">
          {cameraEnabled && cameraStream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="prejoin-video"
            />
          ) : (
            <div className="prejoin-no-camera">
              <div className="prejoin-avatar">
                {participantName?.charAt(0).toUpperCase()}
              </div>
              <p className="prejoin-no-camera-text">Camera is off</p>
            </div>
          )}

          {/* Device toggle overlays on preview */}
          <div className="prejoin-preview-controls">
            <button
              className={`prejoin-device-btn ${micEnabled ? "prejoin-device-btn--on" : "prejoin-device-btn--off"}`}
              onClick={toggleMic}
              title={micEnabled ? "Mute microphone" : "Enable microphone"}
            >
              {micEnabled ? "🎤" : "🔇"}
            </button>
            <button
              className={`prejoin-device-btn ${cameraEnabled ? "prejoin-device-btn--on" : "prejoin-device-btn--off"}`}
              onClick={() => setCameraEnabled((prev) => !prev)}
              title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {cameraEnabled ? "📷" : "📵"}
            </button>
          </div>
        </div>

        {/* Device status labels */}
        <div className="prejoin-device-status">
          <div className={`device-status-item ${micEnabled ? "device-status-item--on" : ""}`}>
            <span>{micEnabled ? "🎤" : "🔇"}</span>
            <span>{micEnabled ? "Microphone on" : "Microphone off"}</span>
          </div>
          <div className={`device-status-item ${cameraEnabled ? "device-status-item--on" : ""}`}>
            <span>{cameraEnabled ? "📷" : "📵"}</span>
            <span>{cameraEnabled ? "Camera on" : "Camera off"}</span>
          </div>
        </div>

        {/* Errors */}
        {(cameraError || micError) && (
          <div className="prejoin-error">
            {cameraError || micError}
          </div>
        )}

        {/* Join button */}
        <button className="prejoin-join-btn" onClick={handleJoin}>
          Join Now
        </button>

        <p className="prejoin-hint">
          You can change your mic and camera anytime during the meeting
        </p>
      </div>
    </div>
  );
}

export default PreJoinModal;
