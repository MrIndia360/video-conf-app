/**
 * useScreenShares
 * -----------------------------------------------
 * Manages multiple simultaneous screen share tracks
 * for the local participant using LiveKit's low-level
 * publishTrack / unpublishTrack API.
 *
 * Each share gets a unique name so they can be
 * started and stopped independently.
 *
 * Usage:
 *   const { shares, startShare, stopShare, stopAll } = useScreenShares();
 */

import { useState, useCallback, useRef } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Track, LocalVideoTrack, LocalAudioTrack } from "livekit-client";

export function useScreenShares() {
  const { localParticipant } = useLocalParticipant();

  // Each share: { id, label, videoTrack, audioTrack, mediaStream }
  const [shares, setShares] = useState([]);
  const shareIdCounter = useRef(0);

  // -----------------------------------------------
  // Start a new screen share
  // -----------------------------------------------
  const startShare = useCallback(async ({ displaySurface = "browser", audio = true, label } = {}) => {
    try {
      // Open native browser picker for the chosen surface
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio,
        selfBrowserSurface: "include",
      });

      const shareId = `share-${++shareIdCounter.current}`;
      const shareLabel = label || `Tab ${shareIdCounter.current}`;

      const rawVideoTrack = stream.getVideoTracks()[0];
      const rawAudioTrack = stream.getAudioTracks()?.[0];

      // Wrap in LiveKit track objects
      const livekitVideoTrack = new LocalVideoTrack(rawVideoTrack, undefined, false);
      const livekitAudioTrack = rawAudioTrack
        ? new LocalAudioTrack(rawAudioTrack, undefined, false)
        : null;

      // Publish video track as ScreenShare source with unique name
      await localParticipant.publishTrack(livekitVideoTrack, {
        source: Track.Source.ScreenShare,
        name: shareId,
      });

      // Publish audio if captured
      if (livekitAudioTrack) {
        await localParticipant.publishTrack(livekitAudioTrack, {
          source: Track.Source.ScreenShareAudio,
          name: `${shareId}-audio`,
        });
      }

      // Auto-stop when user closes share via browser's built-in "Stop sharing" button
      rawVideoTrack.addEventListener("ended", () => {
        stopShare(shareId);
      });

      const shareEntry = {
        id: shareId,
        label: shareLabel,
        displaySurface,
        videoTrack: livekitVideoTrack,
        audioTrack: livekitAudioTrack,
        mediaStream: stream,
      };

      setShares((prev) => [...prev, shareEntry]);
      return shareEntry;

    } catch (err) {
      // User cancelled picker — not an error
      if (err.name === "NotAllowedError") return null;
      throw err;
    }
  }, [localParticipant]);

  // -----------------------------------------------
  // Stop a single screen share by ID
  // -----------------------------------------------
  const stopShare = useCallback(async (shareId) => {
    setShares((prev) => {
      const share = prev.find((s) => s.id === shareId);
      if (!share) return prev;

      // Unpublish from LiveKit
      if (share.videoTrack) {
        localParticipant?.unpublishTrack(share.videoTrack);
        share.videoTrack.stop();
      }
      if (share.audioTrack) {
        localParticipant?.unpublishTrack(share.audioTrack);
        share.audioTrack.stop();
      }

      // Stop media stream tracks
      share.mediaStream?.getTracks().forEach((t) => t.stop());

      return prev.filter((s) => s.id !== shareId);
    });
  }, [localParticipant]);

  // -----------------------------------------------
  // Stop all screen shares
  // -----------------------------------------------
  const stopAll = useCallback(async () => {
    setShares((prev) => {
      prev.forEach((share) => {
        if (share.videoTrack) {
          localParticipant?.unpublishTrack(share.videoTrack);
          share.videoTrack.stop();
        }
        if (share.audioTrack) {
          localParticipant?.unpublishTrack(share.audioTrack);
          share.audioTrack.stop();
        }
        share.mediaStream?.getTracks().forEach((t) => t.stop());
      });
      return [];
    });
  }, [localParticipant]);

  return { shares, startShare, stopShare, stopAll };
}
