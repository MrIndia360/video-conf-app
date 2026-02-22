/**
 * ShareMenu
 * -----------------------------------------------
 * Popup menu above the Share Screen button.
 *
 * Supports multiple simultaneous shares — each share
 * is an independent track. User can add more shares
 * without stopping existing ones, and stop each
 * share individually.
 *
 * "Application Window" shows ALL running apps (VS Code,
 * Terminal, Finder, etc.) via the browser's native picker.
 * On macOS, Chrome needs Screen Recording permission in
 * System Preferences → Privacy & Security → Screen Recording.
 */

import React, { useState, useRef, useEffect } from "react";
import { useScreenShares } from "../hooks/useScreenShares";
import "../styles/ShareMenu.css";

const SHARE_OPTIONS = [
  {
    id: "window",
    icon: "🪟",
    label: "Application Window",
    description: "VS Code, Terminal, Finder, any open app",
    displaySurface: "window",
    badge: null,
  },
  {
    id: "browser",
    icon: "🌐",
    label: "Browser Tab",
    description: "Share a specific browser tab",
    displaySurface: "browser",
    badge: null,
  },
  {
    id: "monitor",
    icon: "🖥️",
    label: "Entire Screen",
    description: "Share everything on your display",
    displaySurface: "monitor",
    badge: null,
  },
];

function ShareMenu({ onClose, onError }) {
  const { shares, startShare, stopShare, stopAll } = useScreenShares();
  const [includeAudio, setIncludeAudio] = useState(true);
  const [isStarting, setIsStarting] = useState(null); // which option is loading
  const [showPermissionHint, setShowPermissionHint] = useState(false);
  const menuRef = useRef(null);

  const hasActiveShares = shares.length > 0;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  async function handleStartShare(displaySurface, optionId) {
    setIsStarting(optionId);
    setShowPermissionHint(false);
    try {
      const result = await startShare({ displaySurface, audio: includeAudio });
      if (!result) {
        // User cancelled picker — show permission hint for window shares
        if (displaySurface === "window") {
          setShowPermissionHint(true);
        } else {
          onClose();
        }
      }
      // Keep menu open so user can add more shares
    } catch (err) {
      onError?.("Could not start screen share. Please try again.");
    } finally {
      setIsStarting(null);
    }
  }

  async function handleStopShare(shareId) {
    await stopShare(shareId);
  }

  async function handleStopAll() {
    await stopAll();
    onClose();
  }

  return (
    <div className="share-menu" ref={menuRef}>
      <div className="share-menu-header">
        {hasActiveShares ? (
          <span>
            Sharing
            <span className="share-count-badge">{shares.length}</span>
          </span>
        ) : (
          "Share your screen"
        )}
      </div>

      {/* Active shares list */}
      {hasActiveShares && (
        <div className="active-shares-list">
          {shares.map((share) => (
            <div key={share.id} className="active-share-item">
              <span className="active-share-dot" />
              <span className="active-share-label">{share.label}</span>
              <button
                className="active-share-stop"
                onClick={() => handleStopShare(share.id)}
                title="Stop this share"
              >
                ✕
              </button>
            </div>
          ))}

          {shares.length > 1 && (
            <button className="stop-all-btn" onClick={handleStopAll}>
              ⏹ Stop All Shares
            </button>
          )}

          <div className="add-more-divider">Add another</div>
        </div>
      )}

      {/* Share options */}
      <div className="share-menu-options">
        {SHARE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`share-option ${opt.id === "window" ? "share-option--featured" : ""}`}
            onClick={() => handleStartShare(opt.displaySurface, opt.id)}
            disabled={isStarting !== null}
          >
            <span className="share-option-icon">{opt.icon}</span>
            <div className="share-option-text">
              <span className="share-option-label">{opt.label}</span>
              <span className="share-option-desc">{opt.description}</span>
            </div>
            <span className="share-option-arrow">
              {isStarting === opt.id ? "⏳" : "›"}
            </span>
          </button>
        ))}
      </div>

      {/* macOS permission hint — shown when window picker returns no result */}
      {showPermissionHint && (
        <div className="permission-hint">
          <div className="permission-hint-title">⚠️ No apps visible?</div>
          <div className="permission-hint-body">
            On macOS, Chrome needs <strong>Screen Recording</strong> permission to see other apps like VS Code.
          </div>
          <a
            className="permission-hint-link"
            href="x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
            target="_blank"
            rel="noreferrer"
          >
            Open macOS Privacy Settings →
          </a>
        </div>
      )}

      {/* Audio toggle */}
      <div className="share-menu-footer">
        <label className="audio-toggle">
          <input
            type="checkbox"
            checked={includeAudio}
            onChange={(e) => setIncludeAudio(e.target.checked)}
          />
          <span className="audio-toggle-track" />
          <span className="audio-toggle-label">🔊 Include system audio</span>
        </label>
      </div>
    </div>
  );
}

export default ShareMenu;
