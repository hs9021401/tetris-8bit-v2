# Specification - Fix Sensitivity Bugs

## Issues
1. **Black Screen on Join**: When a second player joins, the lobby/game screen goes black for both players. This likely means a crash in React rendering due to invalid data format in `player_joined` event.
2. **Host Cannot Edit Sensitivity**: The host's UI sliders might be disabled or unresponsive.

## Investigation Plan
- Inspect `server.js`'s `player_joined` emission format.
- Inspect `src/MultiplayerLobby.jsx`'s `player_joined` handler.
- Verify `isHost` logic in `MultiplayerLobby.jsx`.
- Verify `updateSensitivity` logic.

## Goal
- Ensure `player_joined` sends and receives data correctly without crashing the client.
- Ensure the host can always modify sensitivity settings in the lobby.
- Ensure non-hosts receive the updated settings.
