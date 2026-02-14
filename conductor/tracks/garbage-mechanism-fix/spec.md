# Specification - Fix Garbage Mechanism & UI

## Problem
The user reports that the garbage mechanism (sending lines to opponents) seems broken or unnoticeable.
Currently, `lockPiece` contains inline logic to add garbage lines based on `incomingGarbage`, but it lacks visual feedback, and the logic might be flawed (e.g., slicing the grid incorrectly).

## Goals
1. **Verify Logic**: Ensure `receiveAttack` increments `incomingGarbage` correctly.
2. **Fix Logic**: Ensure `lockPiece` correctly adds garbage lines to the bottom of the grid, pushing existing blocks up (and potentially causing game over if pushed off top).
3. **Add Visual Feedback**: Implement a "Garbage Bar" (Red Meter) next to the playfield to show pending garbage lines.
4. **Server Relay**: Verify `server.js` correctly broadcasts attacks.

## Implementation Details

### Server Side (`server.js`)
- Currently emits `get_attacked` to `socket.to(roomId)`. This sends to *all* other players.
- Logic: 
    - 2 lines cleared -> send 1 line
    - 3 lines cleared -> send 2 lines
    - 4 lines cleared -> send 4 lines
- This seems correct for standard multiplayer Tetris (though usually targeting is specific, broadcasting to all is fine for simple FFA).

### Client Side Logic (`useTetris.js`)
- `receiveAttack(lines)`: Should update `incomingGarbage` state.
- `lockPiece`:
    - After clearing lines and calculating score.
    - Check `incomingGarbage`.
    - If > 0:
        - Remove top N lines (game over check?)
        - Append N garbage lines at bottom.
        - Reset `incomingGarbage` to 0 (or reduce it if we want to cancel out attacks - *cancellation* is a nice feature but maybe out of scope for "fix").
        - **Critical**: The garbage hole position should be consistent for a single attack batch, but random between batches. Currently it's random per line. (Standard is one hole per attack).

### UI (`Tetris.jsx`)
- Add a vertical bar on the left/right of the grid.
- Height corresponds to `incomingGarbage`.
- Color: Red.
