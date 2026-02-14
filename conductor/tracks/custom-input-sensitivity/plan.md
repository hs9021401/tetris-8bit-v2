# Implementation Plan - Custom Input Sensitivity

## Step 1: Constants
Add `DEFAULT_SENSITIVITY` to `src/Constants.js`.

## Step 2: Server Update
Update `server.js` to store and broadcast room-specific sensitivity settings.

## Step 3: Lobby UI
Add sliders to `src/MultiplayerLobby.jsx`. Use clear Chinese labels and descriptions as per spec.

## Step 4: Tetris Component
Update `src/Tetris.jsx` to receive sensitivity settings via props and apply them to the input loop.

## Step 5: Verification
1. Create a room as host.
2. Adjust sliders and verify values change.
3. Start game and verify the "feel" matches the settings.
