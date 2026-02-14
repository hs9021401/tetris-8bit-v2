# Implementation Plan - Level Speed Toggle

## Step 1: `useTetris.js`
1. Accept `levelSpeedUp` in hook args.
2. In `lockPiece`, conditionally update `speedRef`.

## Step 2: `Tetris.jsx`
1. Accept `levelSpeedUp` prop.
2. Pass it to `useTetris`.

## Step 3: `server.js`
1. Update `create_room` to store `levelSpeedUp`.
2. Update `room_created`, `player_joined`, `game_started` to emit `levelSpeedUp`.

## Step 4: `MultiplayerLobby.jsx`
1. Add `levelSpeedUp` state (default true).
2. Render checkbox.
3. Update socket handlers to sync `levelSpeedUp`.
4. Pass `levelSpeedUp` to `Tetris`.

## Step 5: Verification
1. Create a room with speed up ON. Verify speed increases.
2. Create a room with speed up OFF. Verify speed stays constant.
