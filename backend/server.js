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
// POST /api/token
// Body: { roomName: string, participantName: string }
// Returns: { token: string, livekitUrl: string }
// -----------------------------------------------
app.post("/api/token", async (req, res) => {
  const { roomName, participantName } = req.body;

  if (!roomName || !participantName) {
    return res
      .status(400)
      .json({ error: "roomName and participantName are required" });
  }

  try {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      ttl: "1h", // token valid for 1 hour
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,       // can share video/audio/screen
      canSubscribe: true,     // can receive others' streams
      canPublishData: true,   // can send chat messages
    });

    const token = await at.toJwt();

    return res.json({ token, livekitUrl: LIVEKIT_URL });
  } catch (err) {
    console.error("Token generation error:", err);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Video conf backend running" });
});

// All other routes → serve React app (handles client-side routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`✅ Frontend served at http://localhost:${PORT}`);
  console.log(`✅ API available at http://localhost:${PORT}/api`);
});
