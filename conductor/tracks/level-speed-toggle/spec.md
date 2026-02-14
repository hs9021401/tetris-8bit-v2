# Specification - Level Speed Toggle

## Goal
Allow the room host to enable or disable the "Level Speed Up" mechanic. When disabled, the game will not speed up as the player levels up.

## Requirements
- **Lobby UI**: Add a checkbox "Level Speed Up" (default: checked).
- **Synchronization**: The host's setting must be stored on the server and synced to all players upon joining and game start.
- **Game Logic**:
    - If `levelSpeedUp` is true (default): Speed increases with level.
    - If `levelSpeedUp` is false: Speed remains constant (`INITIAL_DROP_SPEED`).

## Implementation Details
1. **`useTetris.js`**: Accept `levelSpeedUp` parameter (boolean, default true). In `lockPiece`, only decrease `speedRef` if true.
2. **`Tetris.jsx`**: Accept `levelSpeedUp` prop and pass to `useTetris`.
3. **`MultiplayerLobby.jsx`**:
    - Add `levelSpeedUp` state.
    - Pass it in `create_room`.
    - Receive it in `room_created`, `player_joined`, `game_started`.
    - Render checkbox for host (enabled) and others (disabled).
4. **`server.js`**:
    - Store `levelSpeedUp` in room object.
    - Emit it in `player_joined`, `game_started`, and `room_created`.
