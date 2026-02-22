# VideoConf App 🎥

A Zoom-like video conferencing app built with React + LiveKit, designed with an **Adapter Pattern** so you can swap video providers (LiveKit → Zoom → Twilio) by changing a single file.

---

## Features
- 📹 HD Video & Audio calls (large group SFU support)
- 🖥️ Screen sharing
- 💬 In-meeting text chat
- 🎤 Mute / camera toggle controls
- 🚪 Lobby page with room name + display name
- ⏱️ Meeting timer
- 🔄 Provider-agnostic architecture (swap SDKs easily)

---

## Setup

### Step 1 — Get LiveKit Credentials
1. Go to https://cloud.livekit.io and sign up (free, no credit card)
2. Create a new project
3. Go to **Settings → Keys**
4. Copy your **API Key**, **API Secret**, and **WebSocket URL**

### Step 2 — Configure Backend
Open `backend/.env` and replace the placeholders:

```
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here
LIVEKIT_URL=wss://your-project.livekit.cloud
```

### Step 3 — Install & Run Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:4000
```

### Step 4 — Install & Run Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

### Step 5 — Open the App
Go to http://localhost:3000, enter your name and a room name, and click **Join Meeting**.
Share the room name with others so they can join the same room.

---

## Swapping Video Providers

To swap from LiveKit to another provider (e.g. Zoom, Twilio):

1. Create a new adapter in `frontend/src/providers/` (e.g. `ZoomAdapter.js`)
2. Implement `getToken(roomName, participantName)` and `getProviderName()`
3. Open `frontend/src/config.js` and change the import — **that's it!**

```js
// config.js — change this one line
import ZoomAdapter from "./providers/ZoomAdapter";   // swap here
const videoProvider = new ZoomAdapter();
```

Zero UI changes needed.

---

## Project Structure

```
video-conf-app/
├── backend/
│   ├── server.js          # Express server — JWT token generation
│   ├── .env               # 👈 Put your LiveKit credentials here
│   └── package.json
└── frontend/
    └── src/
        ├── providers/
        │   ├── VideoProviderInterface.js   # Abstract contract
        │   └── LiveKitAdapter.js           # LiveKit implementation
        ├── context/
        │   └── VideoConferenceContext.jsx  # Global meeting state
        ├── pages/
        │   ├── LobbyPage.jsx              # Join screen
        │   └── MeetingPage.jsx            # Meeting room
        ├── components/
        │   ├── VideoGrid.jsx              # Participant video tiles
        │   ├── Controls.jsx               # Mute/cam/share/chat/leave
        │   └── ChatPanel.jsx              # In-meeting text chat
        ├── styles/                        # CSS for all components
        ├── config.js                      # 👈 Change provider here
        └── App.jsx                        # Root router
```
