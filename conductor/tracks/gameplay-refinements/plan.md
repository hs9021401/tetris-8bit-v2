# Implementation Plan - Gameplay Refinements (Wall Kicks & Lock Delay)

## Step 1: Implement Wall Kicks (`rotatePiece`)
1. Create a `kickTests` array (e.g., `[[0,0], [1,0], [-1,0], [0,1], [0,-1]]` - relative offsets).
2. Modify `rotatePiece` to iterate through these offsets.
3. If an offset works (no collision), apply the rotation and the offset to the `activePiece`.
4. If none work, do not rotate.

## Step 2: Implement Lock Delay (`movePiece` & `useEffect`)
1. Introduce `lockTimerRef` and `isLandingRef`.
2. In `movePiece`:
    - If `dy > 0` (downward move) fails due to collision:
        - Do NOT call `lockPiece` immediately.
        - Start `lockTimer` (500ms) if not already running.
        - Set `isLandingRef.current = true`.
    - If `dy > 0` succeeds:
        - If piece was landing, clear `lockTimer` (it moved down successfully).
        - Set `isLandingRef.current = false`.
    - If `dx !== 0` (sideways move) succeeds:
        - Reset `lockTimer` if the piece is currently landing (touching ground).
3. In `rotatePiece`:
    - If rotation succeeds and piece is landing, reset `lockTimer`.
4. In `hardDrop`:
    - Clear any pending `lockTimer`.
    - Call `lockPiece` immediately.
5. Add a `useEffect` or similar mechanism to handle the `lockTimer` expiration.
    - When timer expires, check if the piece is still colliding downwards. If so, `lockPiece`.

## Step 3: Verification
1. Test L-piece against left wall -> Should rotate and shift right.
2. Test sliding a piece into a 1-wide gap -> Should be possible before locking.
3. Test hard drop -> Should lock instantly.
