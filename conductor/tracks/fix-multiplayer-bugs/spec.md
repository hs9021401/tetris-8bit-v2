# Specification - Fix Multiplayer Bugs

## Problem Description
1. **Hard Drop Bug**: When pressing 'Space' (hard drop), the ghost block materializes, resulting in two identical blocks at the same location.
2. **Game Over Bug**: Holding the 'Down' arrow key to drop the block to the bottom causes an immediate 'GAME OVER'.

## Root Cause Analysis (Preliminary)
- `hardDrop` and `movePiece` call `lockPiece` inside an `setActivePiece` updater.
- `lockPiece` calls `spawnPiece`, which again calls `setActivePiece`.
- This nested `setState` logic causes race conditions or incorrect state updates, leading to double spawning or premature collision detection at the spawn point.

## Goals
- Refactor `hardDrop` and `movePiece` to avoid nested `setActivePiece` calls.
- Ensure `lockPiece` and `spawnPiece` are called in a way that respects React's state update cycle.
- Fix the logic that causes the ghost block to persist or double-solidify.
- Fix the premature 'GAME OVER' when holding the down key.
