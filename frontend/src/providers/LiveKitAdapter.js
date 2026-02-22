/**
 * LiveKitAdapter
 * -----------------------------------------------
 * LiveKit implementation of VideoProviderInterface.
 * This is the ONLY file that knows about LiveKit.
 *
 * To swap to Zoom or Twilio later:
 *   - Create ZoomAdapter.js / TwilioAdapter.js
 *   - Mirror the same methods below
 *   - Update config.js — done!
 */

import VideoProviderInterface from "./VideoProviderInterface";

class LiveKitAdapter extends VideoProviderInterface {
  /**
   * Calls our Node.js backend to get a LiveKit JWT token.
   * The backend holds the secret — never exposed to the browser.
   */
  async getToken(roomName, participantName) {
    const response = await fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, participantName }),
    });

    if (!response.ok) {
      throw new Error("Failed to get token from backend");
    }

    const data = await response.json();

    // Return a normalized shape — UI doesn't care about LiveKit specifics
    return {
      token: data.token,
      serverUrl: data.livekitUrl,
    };
  }

  getProviderName() {
    return "LiveKit";
  }
}

export default LiveKitAdapter;
