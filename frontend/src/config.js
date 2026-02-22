/**
 * config.js
 * -----------------------------------------------
 * 👇 THIS IS THE ONLY FILE YOU CHANGE TO SWAP PROVIDERS
 *
 * Want to switch from LiveKit to Zoom?
 *   1. Create ZoomAdapter.js in /providers
 *   2. Import it here and replace LiveKitAdapter
 *   Done. No UI changes needed.
 */

import LiveKitAdapter from "./providers/LiveKitAdapter";
// import ZoomAdapter from "./providers/ZoomAdapter";   // future
// import TwilioAdapter from "./providers/TwilioAdapter"; // future

const videoProvider = new LiveKitAdapter();

export default videoProvider;
