# Implementation Plan - Fix Garbage Mechanism & UI

## Step 1: Logic Verification & Cleanup (`useTetris.js`)
1. Review `lockPiece`:
    - Ensure incoming garbage logic correctly slices off top lines (game over check) and appends to bottom.
    - Check if the hole position logic should be consistent for a single attack.
    - Fix potential issue where `setIncomingGarbage(0)` might clear new attacks received during the lock process (unlikely due to JS single thread, but React state updates batching could be tricky).

## Step 2: Implement Visual Feedback (`Tetris.jsx`)
1. Add a `GarbageBar` component next to the main grid.
2. Render height based on `incomingGarbage` state (e.g., 1 unit = 1 block height).
3. Max height logic (clamp to grid height).

## Step 3: Server Side Check (`server.js`)
1. Review `socket.on('attack')` logic.
2. Ensure it broadcasts to `socket.to(roomId)` correctly.

## Step 4: Testing
1. Add test case in `useTetris.test.jsx` for `receiveAttack` + `lockPiece`.
2. Verify garbage lines appear at the bottom.
