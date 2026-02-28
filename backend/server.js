require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------------------------
// File-based room persistence
// Rooms are written to disk on every mutation so they
// survive server restarts and crashes.
// -----------------------------------------------
const STATE_FILE = path.join(__dirname, "rooms-state.json");

function loadRooms() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      console.log(`✅ Loaded ${Object.keys(parsed).length} room(s) from disk`);
      return parsed;
    }
  } catch (err) {
    console.warn("⚠️  Could not load rooms state, starting fresh:", err.message);
  }
  return {};
}

function saveRooms() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(rooms, null, 2), "utf8");
  } catch (err) {
    console.error("❌ Failed to save rooms state:", err.message);
  }
}

const rooms = loadRooms();

function getRoom(roomName) {
  if (!rooms[roomName]) {
    rooms[roomName] = {
      hostIdentity: null,
      coHosts: [],
      waiting: [],
      approved: [],
      rejected: [],
    };
  }
  return rooms[roomName];
}

// -----------------------------------------------
// SSE subscriber registry
// sseClients[roomName] = [ { participantName, res }, ... ]
// -----------------------------------------------
const sseClients = {};

function addSseClient(roomName, participantName, res) {
  if (!sseClients[roomName]) sseClients[roomName] = [];
  sseClients[roomName].push({ participantName, res });
}

function removeSseClient(roomName, res) {
  if (!sseClients[roomName]) return;
  sseClients[roomName] = sseClients[roomName].filter((c) => c.res !== res);
  if (sseClients[roomName].length === 0) delete sseClients[roomName];
}

// Push an event to every subscriber in a room
function notifyRoom(roomName, payload) {
  const clients = sseClients[roomName] || [];
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  clients.forEach(({ res }) => {
    try { res.write(data); } catch (_) {}
  });
}

// Push an event to a single participant
function notifyParticipant(roomName, participantName, payload) {
  const clients = sseClients[roomName] || [];
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  clients
    .filter((c) => c.participantName === participantName)
    .forEach(({ res }) => {
      try { res.write(data); } catch (_) {}
    });
}

// -----------------------------------------------
// In-memory rate limiter (sliding window, no npm)
// -----------------------------------------------
const rateLimitStore = {};

setInterval(() => {
  const now = Date.now();
  for (const key of Object.keys(rateLimitStore)) {
    rateLimitStore[key] = rateLimitStore[key].filter(t => now - t < 60000);
    if (rateLimitStore[key].length === 0) delete rateLimitStore[key];
  }
}, 5 * 60 * 1000);

function rateLimit({ maxRequests, windowMs, message }) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    if (!rateLimitStore[key]) rateLimitStore[key] = [];
    rateLimitStore[key] = rateLimitStore[key].filter(t => now - t < windowMs);
    if (rateLimitStore[key].length >= maxRequests) {
      return res.status(429).json({
        error: message || "Too many requests. Please slow down.",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }
    rateLimitStore[key].push(now);
    next();
  };
}

const joinLimit    = rateLimit({ maxRequests: 10,  windowMs: 60000, message: "Too many join attempts. Wait a minute." });
const pollLimit    = rateLimit({ maxRequests: 60,  windowMs: 60000, message: "Polling too fast." });
const admitLimit   = rateLimit({ maxRequests: 60,  windowMs: 60000, message: "Too many admit/reject actions." });
const generalLimit = rateLimit({ maxRequests: 100, windowMs: 60000 });

// Serve React frontend build
app.use(express.static(path.join(__dirname, "../frontend/build")));

const {
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  LIVEKIT_URL,
  PORT = 4000,
} = process.env;

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
// GET /api/room-stream?roomName=x&participantName=y
//
// Server-Sent Events endpoint. Each participant opens
// exactly ONE connection here after calling /api/request-join.
// The server pushes these event types:
//
//   role-update    → { type, hostIdentity, coHosts }
//                    Sent immediately on connect, and whenever
//                    host or co-host list changes.
//
//   admitted       → { type, token, livekitUrl }
//                    Sent to a waiting participant when the host admits them.
//
//   rejected       → { type }
//                    Sent to a waiting participant when the host rejects them.
//
//   waiting-update → { type, waiting: [] }
//                    Sent to host and co-hosts when the waiting list changes.
// -----------------------------------------------
app.get("/api/room-stream", (req, res) => {
  const { roomName, participantName } = req.query;
  if (!roomName || !participantName) {
    return res.status(400).json({ error: "roomName and participantName required" });
  }

  // SSE headers — keep the connection alive
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // stops nginx from buffering SSE
  res.flushHeaders();

  // Send current role state immediately so the client is up to date on connect
  const room = getRoom(roomName);
  res.write(`data: ${JSON.stringify({
    type: "role-update",
    hostIdentity: room.hostIdentity,
    coHosts: room.coHosts,
  })}\n\n`);

  addSseClient(roomName, participantName, res);

  // Keep-alive comment every 20 s — prevents proxies from killing idle connections
  const keepAlive = setInterval(() => {
    try { res.write(": ping\n\n"); } catch (_) {}
  }, 20000);

  req.on("close", () => {
    clearInterval(keepAlive);
    removeSseClient(roomName, res);
  });
});

// -----------------------------------------------
// POST /api/request-join
// -----------------------------------------------
app.post("/api/request-join", joinLimit, async (req, res) => {
  const { roomName, participantName } = req.body;
  if (!roomName || !participantName) {
    return res.status(400).json({ error: "roomName and participantName are required" });
  }

  const room = getRoom(roomName);

  // First person → host, joins immediately
  if (!room.hostIdentity) {
    room.hostIdentity = participantName;
    saveRooms();
    const token = await generateToken(roomName, participantName);
    return res.json({ status: "joined", isHost: true, token, livekitUrl: LIVEKIT_URL });
  }

  // Re-joining after disconnect (already approved or the host themselves)
  if (room.approved.includes(participantName) || room.hostIdentity === participantName) {
    const token = await generateToken(roomName, participantName);
    return res.json({
      status: "joined",
      isHost: room.hostIdentity === participantName,
      token,
      livekitUrl: LIVEKIT_URL,
    });
  }

  // Previously rejected
  if (room.rejected.includes(participantName)) {
    return res.json({ status: "rejected" });
  }

  // Add to waiting list if not already there
  if (!room.waiting.includes(participantName)) {
    room.waiting.push(participantName);
    saveRooms();
    // Push updated waiting list to host and co-hosts via SSE
    const update = { type: "waiting-update", waiting: room.waiting };
    notifyParticipant(roomName, room.hostIdentity, update);
    room.coHosts.forEach((ch) => notifyParticipant(roomName, ch, update));
  }

  return res.json({ status: "waiting" });
});

// -----------------------------------------------
// GET /api/waiting-status  (HTTP fallback — still works)
// -----------------------------------------------
app.get("/api/waiting-status", pollLimit, async (req, res) => {
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
// GET /api/waiting-list  (HTTP fallback — still works)
// -----------------------------------------------
app.get("/api/waiting-list", pollLimit, (req, res) => {
  const { roomName } = req.query;
  const room = getRoom(roomName);
  res.json({ waiting: room.waiting });
});

// -----------------------------------------------
// POST /api/admit
// -----------------------------------------------
app.post("/api/admit", admitLimit, async (req, res) => {
  const { roomName, participantName } = req.body;
  const room = getRoom(roomName);

  room.waiting = room.waiting.filter((p) => p !== participantName);
  if (!room.approved.includes(participantName)) {
    room.approved.push(participantName);
  }
  saveRooms();

  // Push the admission token directly to the waiting participant via SSE
  const token = await generateToken(roomName, participantName);
  notifyParticipant(roomName, participantName, {
    type: "admitted",
    token,
    livekitUrl: LIVEKIT_URL,
  });

  // Notify host + co-hosts of the updated waiting list
  const update = { type: "waiting-update", waiting: room.waiting };
  notifyParticipant(roomName, room.hostIdentity, update);
  room.coHosts.forEach((ch) => notifyParticipant(roomName, ch, update));

  res.json({ success: true });
});

// -----------------------------------------------
// POST /api/reject
// -----------------------------------------------
app.post("/api/reject", admitLimit, (req, res) => {
  const { roomName, participantName } = req.body;
  const room = getRoom(roomName);

  room.waiting = room.waiting.filter((p) => p !== participantName);
  if (!room.rejected.includes(participantName)) {
    room.rejected.push(participantName);
  }
  saveRooms();

  // Push rejection directly to the participant
  notifyParticipant(roomName, participantName, { type: "rejected" });

  // Notify host + co-hosts
  const update = { type: "waiting-update", waiting: room.waiting };
  notifyParticipant(roomName, room.hostIdentity, update);
  room.coHosts.forEach((ch) => notifyParticipant(roomName, ch, update));

  res.json({ success: true });
});

// -----------------------------------------------
// GET /api/room-info  (HTTP fallback — still works)
// -----------------------------------------------
app.get("/api/room-info", pollLimit, (req, res) => {
  const { roomName } = req.query;
  if (!roomName) return res.status(400).json({ error: "roomName is required" });
  const room = getRoom(roomName);
  res.json({ hostIdentity: room.hostIdentity, coHosts: room.coHosts });
});

// -----------------------------------------------
// POST /api/promote-cohost
// -----------------------------------------------
app.post("/api/promote-cohost", admitLimit, (req, res) => {
  const { roomName, participantName } = req.body;
  if (!roomName || !participantName) {
    return res.status(400).json({ error: "roomName and participantName are required" });
  }
  const room = getRoom(roomName);
  if (!room.coHosts.includes(participantName)) {
    room.coHosts.push(participantName);
  }
  saveRooms();
  // Push updated roles to everyone in the room immediately
  notifyRoom(roomName, {
    type: "role-update",
    hostIdentity: room.hostIdentity,
    coHosts: room.coHosts,
  });
  res.json({ success: true });
});

// -----------------------------------------------
// POST /api/remove-cohost
// -----------------------------------------------
app.post("/api/remove-cohost", admitLimit, (req, res) => {
  const { roomName, participantName } = req.body;
  if (!roomName || !participantName) {
    return res.status(400).json({ error: "roomName and participantName are required" });
  }
  const room = getRoom(roomName);
  room.coHosts = room.coHosts.filter((name) => name !== participantName);
  saveRooms();
  notifyRoom(roomName, {
    type: "role-update",
    hostIdentity: room.hostIdentity,
    coHosts: room.coHosts,
  });
  res.json({ success: true });
});

// -----------------------------------------------
// POST /api/room-ended
// -----------------------------------------------
app.post("/api/room-ended", generalLimit, (req, res) => {
  const { roomName, participantName } = req.body;
  if (!roomName) return res.status(400).json({ error: "roomName is required" });

  const room = rooms[roomName];
  if (!room) return res.json({ success: true });

  if (participantName && room.hostIdentity === participantName) {
    if (room.coHosts.length > 0) {
      // Promote the first co-host to host
      const newHost = room.coHosts.shift();
      room.hostIdentity = newHost;
      if (!room.approved.includes(newHost)) {
        room.approved.push(newHost);
      }
      saveRooms();
      // Tell everyone in the room about the new host instantly
      notifyRoom(roomName, {
        type: "role-update",
        hostIdentity: room.hostIdentity,
        coHosts: room.coHosts,
      });
    } else {
      // No co-hosts — the meeting is over
      delete rooms[roomName];
      saveRooms();
    }
  }

  res.json({ success: true });
});

// -----------------------------------------------
// Health check
// -----------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    activeRooms: Object.keys(rooms).length,
    sseConnections: Object.values(sseClients).reduce((n, arr) => n + arr.length, 0),
  });
});

// All other routes → React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`✅ Loaded ${Object.keys(rooms).length} room(s) from disk`);
});
