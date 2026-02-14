# Implementation Plan - Fix Sensitivity Bugs

## Step 1: Diagnose & Fix `player_joined`
1. Read `server.js` to see how `player_joined` is emitted.
2. Read `src/MultiplayerLobby.jsx` to see how it receives `player_joined`.
3. Check for format mismatch (Array vs Object).
4. **Fix**: Ensure consistent data structure (Object with `players` and `sensitivity`).

## Step 2: Diagnose & Fix Host Editing
1. Check `isHost` logic in `MultiplayerLobby.jsx`.
2. Check `SensitivitySliders` rendering.
3. **Fix**: Ensure `socket.id` is available and matches `players[0].id`.
4. Ensure `update_settings` event is properly handled on server and client.

## Step 3: Verification
1. Create a room as host.
2. Verify sensitivity sliders are editable.
3. Join as a second player (simulated or hypothetical).
4. Verify both screens remain functional and show updated players.
