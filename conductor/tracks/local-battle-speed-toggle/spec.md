# Specification - Local Battle Speed Toggle

## Goal
Add the "Level Speed Up" toggle to the Local Battle mode, allowing players to choose whether the game speeds up as levels increase.

## Requirements
- **UI**: Add a checkbox in the `LocalMultiplayer` pre-game screen (where "START BATTLE" is).
- **Logic**: Pass the toggle state to both P1 and P2 `Tetris` components.

## Implementation
1. **`LocalMultiplayer.jsx`**:
    - Add `const [levelSpeedUp, setLevelSpeedUp] = useState(true);`
    - Render Checkbox.
    - Pass `levelSpeedUp={levelSpeedUp}` to `<Tetris />`.
