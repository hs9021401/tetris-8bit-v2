# Implementation Plan - Local Multiplayer

## Step 1: Refactor `Tetris.jsx`
1. Accept `controls` prop (object with `{ left: 'a', right: 'd', rotate: 'w', down: 's', hardDrop: 'Control' }`).
2. If `controls` is provided, use those keys in `handleKeyDown` and `moveLoop`.
3. If not provided, default to arrow keys.
4. Note: `e.key` vs `e.code`. `e.key` is often 'a' or 'A' depending on CapsLock. `e.code` is 'KeyA', 'ArrowLeft', 'ControlLeft', 'ControlRight'.
    - **Decision**: Use `e.code` for reliability.
    - Default (P1): `KeyA`, `KeyD`, `KeyS`, `KeyW`, `ControlLeft`.
    - Default (P2): `ArrowLeft`, `ArrowRight`, `ArrowDown`, `ArrowUp`, `ControlRight`.
    - Single Player: Arrow keys (keep current behavior but map to `Arrow...`).

## Step 2: Create `LocalMultiplayer.jsx`
1. Render two `Tetris` instances.
2. Pass specific `controls` to each.
3. Handle communication:
    - Pass `onAttack` callback to P1. Inside P1's callback, call `p2Ref.current.receiveAttack(lines)`.
    - Pass `onAttack` callback to P2. Inside P2's callback, call `p1Ref.current.receiveAttack(lines)`.
    - This requires `Tetris` to expose `receiveAttack` via `forwardRef` + `useImperativeHandle`.
    - Or lift `useTetris` state up. Lifting state is cleaner but requires more refactoring of `Tetris.jsx`.
    - **Better**: Create a wrapper component `LocalTetris` that uses `useTetris` and renders a `TetrisView`.
    - **Decision**: Make `Tetris.jsx` flexible. If `state` and `handlers` are passed as props, use them. If not, use internal `useTetris`. This allows `LocalMultiplayer` to call `useTetris` twice and pass everything down, giving it full control over attack logic.

## Step 3: Integrate into App
1. Update `App.jsx` to route to `LocalMultiplayer` based on user selection.
2. Add "Local VS" button on main menu.

## Step 4: Verification
1. Test WASD movement for P1.
2. Test Arrow movement for P2.
3. Verify P1 attack sends garbage to P2.
4. Verify P2 attack sends garbage to P1.
