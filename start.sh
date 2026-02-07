#!/bin/bash
PORT="${1:-3005}"

# Kill any process on the target port
PID=$(lsof -ti:"$PORT" 2>/dev/null)
if [ -n "$PID" ]; then
  echo "Killing process $PID on port $PORT..."
  kill -9 $PID 2>/dev/null
  sleep 1
fi

# Remove stale Next.js lock file
rm -f .next/dev/lock

echo "Starting dev server on port $PORT..."
PORT=$PORT npx next dev
