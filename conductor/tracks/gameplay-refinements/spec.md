# Specification - Gameplay Refinements (Wall Kicks & Lock Delay)

## Goals
1. **Enable Wall Kicks**: Allow pieces to rotate even when adjacent to walls or other blocks by attempting alternative positions (kicks).
2. **Implement Lock Delay**: Prevent pieces from locking immediately upon touching the ground. Give the player a short window (approx. 500ms) to slide or rotate the piece into place before it locks.

## Requirements

### Wall Kicks
- When `rotatePiece` detects a collision, it should try checking the rotated shape at alternate positions:
    - `x + 1` (Kick Right)
    - `x - 1` (Kick Left)
    - `y - 1` (Kick Up - optional but good for T-Spins/floor kicks)
    - `x + 2` / `x - 2` (For I-piece specifically, if needed)
- If an alternate position is valid, update the piece's position and shape.
- If all attempts fail, rotation fails.

### Lock Delay (Infinity Rule / Move Reset)
- Remove immediate `lockPiece` call in `movePiece` when `dy > 0` collision occurs.
- Instead, when a piece lands (collision below):
    - Start a `lockTimer` (e.g., 500ms).
    - If the piece moves successfully (left/right) or rotates successfully during this time:
        - Reset the `lockTimer`.
        - Verify if the piece is still on the ground. If it is in the air, cancel the timer.
- If the `lockTimer` expires, call `lockPiece`.
- `hardDrop` should always lock immediately, bypassing the delay.
- Visual feedback (optional but good): Ghost piece or active piece might flash or change color (not strictly required for this task but good to keep in mind).

## Files to Modify
- `src/useTetris.js`
