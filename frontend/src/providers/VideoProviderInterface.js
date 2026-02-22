/**
 * VideoProviderInterface
 * -----------------------------------------------
 * This is the contract every video provider adapter
 * must follow. Your UI will ONLY ever talk to this
 * interface — never to Zoom, LiveKit, or Twilio directly.
 *
 * To swap providers:
 *   1. Create a new adapter (e.g. ZoomAdapter.js)
 *   2. Implement all methods below
 *   3. Change one line in config.js
 *
 * That's it. Zero UI changes needed.
 */

class VideoProviderInterface {
  /**
   * Fetch a short-lived auth token from your backend
   * @param {string} roomName
   * @param {string} participantName
   * @returns {Promise<{ token: string, serverUrl: string }>}
   */
  async getToken(roomName, participantName) {
    throw new Error("getToken() must be implemented by the provider adapter");
  }

  /**
   * Returns the provider name (for debugging/display)
   * @returns {string}
   */
  getProviderName() {
    throw new Error("getProviderName() must be implemented");
  }
}

export default VideoProviderInterface;
