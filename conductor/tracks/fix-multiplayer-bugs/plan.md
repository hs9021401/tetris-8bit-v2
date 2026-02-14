# Implementation Plan - Fix Multiplayer Bugs

## Proposed Changes

### 1. Refactor `src/useTetris.js`
- Decouple `lockPiece` and `spawnPiece` from the `setActivePiece` updater.
- Use a flag or a direct state update for locking the piece.
- Ensure that once a piece is locked, it is immediately removed from `activePiece` and a new one is spawned in a separate cycle or a well-ordered sequence.
- Fix `hardDrop` to calculate the final position and then call `lockPiece` directly without nesting `setActivePiece`.

### 2. Implementation Steps
1. Modify `movePiece` to return whether the move was successful and if it reached the bottom.
2. Modify `hardDrop` to correctly calculate the drop position and trigger locking.
3. Update `lockPiece` to accept the piece to lock and handle the grid update and spawning.
4. Ensure `spawnPiece` is called safely after the grid has been updated.

## Verification Plan
1. Manual testing of 'Space' (hard drop) to ensure only one piece is locked.
2. Manual testing of holding 'Down' arrow to ensure it doesn't trigger 'GAME OVER' when reaching the bottom.
3. Run existing tests: `npm test` (if available, though `package.json` says `vitest`).
4. Add regression tests if possible.
