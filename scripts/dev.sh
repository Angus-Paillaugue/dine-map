#!/usr/bin/env bash

export PORT=5173

env HOST=0.0.0.0 PORT=$PORT bun --bun run dev & disown
sleep 1
adb reverse tcp:$PORT tcp:$PORT
scrcpy --max-size 1080 --video-bit-rate 2M --max-fps 30 --no-audio --new-display
