require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { AccessToken } = require("livekit-server-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// Serve React frontend build files
app.use(express.static(path.join(__dirname, "../frontend/build")));

const {
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  LIVEKIT_URL,
  PORT = 4000,
} = process.env;

// -----------------------------------------------
// In-memory waiting room state
// rooms: { [roomName]: { hostIdentity, waiting: [], approved: [], rejected: [] } }
// -----------------------------------------------
const rooms = {};

function getRoom(roomName) {
  if (!rooms[roomName]) {
    rooms[roomName] = { hostIdentity: null, waiting: [], approved: [], rejected: [] };
  }
  return rooms[roomName];
}

function generateToken(roomName, participantName, canPublish = true) {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
    ttl: "1h",
  });
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
  });
  return at.toJwt();
}

// -----------------------------------------------
// POST /api/request-join
// First participant becomes host and gets a token immediately.
// Everyone else is added to waiting list.
// Body: { roomName, participantName }
// Returns: { status: "joined"|"waiting", token?, livekitUrl? }
// -----------------------------------------------
app.post("/api/request-join", async (req, res) => {
  const { roomName, participantName } = req.body;

  if (!roomName || !participantName) {
    return res.status(400).json({ error: "roomName and participantName are required" });
  }

  const room = getRoom(roomName);

  // First person in the room → becomes host, joins immediately
  if (!room.hostIdentity) {
    room.hostIdentity = participantName;
    const token = await generateToken(roomName, participantName);
    return res.json({ status: "joined", isHost: true, token, livekitUrl: LIVEKIT_URL });
  }

  // Already approved (re-joining after a disconnect)
  if (room.approved.includes(participantName)) {
    const token = await generateToken(roomName, participantName);
    return res.json({ status: "joined", isHost: false, token, livekitUrl: LIVEKIT_URL });
  }

  // Rejected
  if (room.rejected.includes(participantName)) {
    return res.json({ status: "rejected" });
  }

  // Add to waiting list if not already there
  if (!room.waiting.includes(participantName)) {
    room.waiting.push(participantName);
  }

  return res.json({ status: "waiting" });
});

// -----------------------------------------------
// GET /api/waiting-status?roomName=x&participantName=y
// Called by waiting participants to poll their status
// -----------------------------------------------
app.get("/api/waiting-status", async (req, res) => {
  const { roomName, participantName } = req.query;
  const room = getRoom(roomName);

  if (room.approved.includes(participantName)) {
    const token = await generateToken(roomName, participantName);
    return res.json({ status: "joined", isHost: false, token, livekitUrl: LIVEKIT_URL });
  }

  if (room.rejected.includes(participantName)) {
    return res.json({ status: "rejected" });
  }

  return res.json({ status: "waiting" });
});

// -----------------------------------------------
// GET /api/waiting-list?roomName=x
// Called by host to see who is waiting
// -----------------------------------------------
app.get("/api/waiting-list", (req, res) => {
  const { roomName } = req.query;
  const room = getRoom(roomName);
  res.json({ waiting: room.waiting });
});

// -----------------------------------------------
// POST /api/admit
// Host admits a participant
// Body: { roomName, participantName }
// -----------------------------------------------
app.post("/api/admit", (req, res) => {
  const { roomName, participantName } = req.body;
  const room = getRoom(roomName);
  room.waiting = room.waiting.filter((p) => p !== participantName);
  if (!room.approved.includes(participantName)) {
    room.approved.push(participantName);
  }
  res.json({ success: true });
});

// -----------------------------------------------
// POST /api/reject
// Host rejects a participant
// Body: { roomName, participantName }
// -----------------------------------------------
app.post("/api/reject", (req, res) => {
  const { roomName, participantName } = req.body;
  const room = getRoom(roomName);
  room.waiting = room.waiting.filter((p) => p !== participantName);
  if (!room.rejected.includes(participantName)) {
    room.rejected.push(participantName);
  }
  res.json({ success: true });
});

// -----------------------------------------------
// POST /api/room-ended
// Called when host leaves — clean up room state
// -----------------------------------------------
app.post("/api/room-ended", (req, res) => {
  const { roomName } = req.body;
  delete rooms[roomName];
  res.json({ success: true });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Video conf backend running" });
});

// All other routes → serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`✅ Frontend served at http://localhost:${PORT}`);
  console.log(`✅ API available at http://localhost:${PORT}/api`);
});
