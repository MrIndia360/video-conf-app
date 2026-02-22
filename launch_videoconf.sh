#!/bin/bash

# Clean up old log and ngrok processes
rm -f /tmp/videoconf_output.log
pkill -f "ngrok" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true

cd "$(dirname "$0")"
./start.sh > /tmp/videoconf_output.log 2>&1 &

START_PID=$!

# Wait for ngrok API to be available and fetch the public URL
while true; do
  URL=$(curl -s http://localhost:4040/api/tunnels | \
    python3 -c "import sys,json; tunnels=json.load(sys.stdin).get('tunnels',[]); print(next((t['public_url'] for t in tunnels if t['public_url'].startswith('https')),''))" 2>/dev/null)
  if [ ! -z "$URL" ]; then
    open "$URL"
    break
  fi
  sleep 2
done

wait $START_PID