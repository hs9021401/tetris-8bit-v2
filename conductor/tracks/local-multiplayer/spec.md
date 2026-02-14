# Specification - Local Multiplayer (Split Screen)

## Goal
Enable local 2-player mode on the same machine using a single keyboard.

## Controls
- **Player 1**:
    - Left: A
    - Right: D
    - Soft Drop: S
    - Rotate: W
    - Hard Drop: Space (or Left Ctrl - User requested Left Ctrl but Space is standard. Let's support both or stick to user request. User said: "Left Ctrl for hard drop").
    - **Wait**: `ctrlKey` modifiers in browser events can be tricky (e.g., browser shortcuts). But `e.code` usually works.
    - Let's use `ControlLeft` and `ControlRight`.

- **Player 2**:
    - Left: ArrowLeft
    - Right: ArrowRight
    - Soft Drop: ArrowDown
    - Rotate: ArrowUp
    - Hard Drop: Right Ctrl (User requested Right Ctrl).

## Mechanics
- **Independent Game Loop**: Each player has their own grid, piece, score.
- **Attack System**:
    - When P1 clears lines (2+), P2 receives garbage.
    - When P2 clears lines (2+), P1 receives garbage.
    - Garbage logic should be identical to online multiplayer (random hole per line or per attack).
- **Game Over**: First to top out loses. The other wins.
- **UI**: Split screen. P1 on left, P2 on right. Shared central info (Timer? Or just "VS").

## Implementation Plan
1. **Refactor `Tetris.jsx`**: Accept `controls` prop (object mapping actions to key codes).
2. **Create `LocalMultiplayer.jsx`**:
    - Parent component managing two `Tetris` instances.
    - Handle `onAttack` from one to call `receiveAttack` on the other.
    - Use `useRef` to access `receiveAttack` methods of children (or lift state up - lifting `useTetris` state is complex, better to use `forwardRef` or just pass a callback if `useTetris` is inside `Tetris`).
    - Actually, `useTetris` is a hook. `LocalMultiplayer` can call `useTetris` twice!
        - `const p1 = useTetris(...)`
        - `const p2 = useTetris(...)`
    - Then render two `Tetris` components, passing the state and handlers down.
    - **Wait**: `Tetris.jsx` currently calls `useTetris` internally.
    - **Refactor**: We should probably **lift `useTetris` out of `Tetris.jsx`** or make `Tetris.jsx` flexible (it can accept `useTetris` result as props OR call it internally).
    - **Better approach**: Create a `TetrisView.jsx` (dumb component) and keep `Tetris.jsx` (smart component with `useTetris`). But `Tetris.jsx` binds keys globally.
    - **Best approach**: `Tetris.jsx` accepts a `controls` prop. If provided, it uses those keys. Default to arrows if not.
    - But if we have two `Tetris` components mounted, they both add event listeners. We need to make sure they don't conflict.
    - P1's `Tetris` will listen for WASD. P2's `Tetris` will listen for Arrows.
    - This works fine as long as keys don't overlap.

## Key Codes
- P1: `KeyA`, `KeyD`, `KeyS`, `KeyW`, `ControlLeft` (or `Space` as alt).
- P2: `ArrowLeft`, `ArrowRight`, `ArrowDown`, `ArrowUp`, `ControlRight` (or `Enter`/`Numpad0` as alt).

## User Request Detail
- P1: WASD + Left Ctrl (Hard Drop).
- P2: Arrows + Right Ctrl (Hard Drop).
