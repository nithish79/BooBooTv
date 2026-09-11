#!/usr/bin/env bash
cd "$(dirname "$0")"

echo "====================================================================="
echo "                    OpenIPTV - Portable Edition"
echo "====================================================================="

if command -v node >/dev/null 2>&1; then
    NODE_CMD="node"
elif [ -f "./bin/node" ]; then
    NODE_CMD="./bin/node"
else
    echo "[!] Node.js runtime not found. Please install node or place binary in bin/node."
    exit 1
fi

export PORT=3001
export NODE_ENV=production

echo "[*] Starting OpenIPTV server on port 3001..."
$NODE_CMD dist/server/index.js &
SERVER_PID=$!

echo "[*] Server started with PID: $SERVER_PID"
sleep 2

URL="http://localhost:3001"
echo "[*] Opening $URL ..."
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"
elif command -v open >/dev/null 2>&1; then
    open "$URL"
fi

wait $SERVER_PID
