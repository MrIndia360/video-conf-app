#!/bin/bash

# -----------------------------------------------
# VideoConf App — One command to rule them all
# Builds frontend, starts backend, starts ngrok
# and prints the shareable URL automatically
# -----------------------------------------------

set -e  # stop if any command fails

# Colors for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

echo ""
echo -e "${BLUE}🎥 VideoConf App Starting...${NC}"
echo "================================"

# -----------------------------------------------
# Step 1 — Kill any existing processes
# -----------------------------------------------
echo -e "\n${YELLOW}[1/4] Cleaning up old processes...${NC}"
pkill -f "node server.js" 2>/dev/null || true
pkill -f "ngrok" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Cleaned up${NC}"

# -----------------------------------------------
# Step 2 — Build React frontend
# -----------------------------------------------
echo -e "\n${YELLOW}[2/4] Building React frontend...${NC}"
cd "$FRONTEND_DIR"
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# -----------------------------------------------
# Step 3 — Start backend server
# -----------------------------------------------
echo -e "\n${YELLOW}[3/4] Starting backend server on port 4000...${NC}"
cd "$BACKEND_DIR"
node server.js &
BACKEND_PID=$!
sleep 2  # wait for server to be ready
echo -e "${GREEN}✅ Backend running (PID: $BACKEND_PID)${NC}"

# -----------------------------------------------
# Step 4 — Start ngrok + get public URL
# -----------------------------------------------
echo -e "\n${YELLOW}[4/4] Starting ngrok tunnel...${NC}"
ngrok http 4000 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
sleep 3  # wait for ngrok to connect

# Fetch the public URL from ngrok's local API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels \
  | python3 -c "import sys,json; tunnels=json.load(sys.stdin)['tunnels']; print(next(t['public_url'] for t in tunnels if t['public_url'].startswith('https')))" \
  2>/dev/null)

if [ -z "$NGROK_URL" ]; then
  echo -e "${RED}❌ Could not get ngrok URL. Check ngrok is installed and authenticated.${NC}"
  echo "Try running: ngrok http 4000"
  exit 1
fi

# -----------------------------------------------
# Done — Print shareable URL
# -----------------------------------------------
echo ""
echo "================================"
echo -e "${GREEN}🚀 VideoConf is LIVE!${NC}"
echo "================================"
echo ""
echo -e "  ${BLUE}📱 Share this URL with anyone:${NC}"
echo -e "  ${GREEN}${NGROK_URL}${NC}"
echo ""
echo -e "  ${BLUE}🔧 Local URL:${NC}          http://localhost:4000"
echo -e "  ${BLUE}🔧 ngrok dashboard:${NC}    http://localhost:4040"
echo ""
echo "================================"
echo -e "${YELLOW}Press Ctrl+C to stop everything${NC}"
echo ""

# Keep script running, clean up on exit
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $NGROK_PID 2>/dev/null; echo 'Done.'" EXIT
wait $BACKEND_PID
