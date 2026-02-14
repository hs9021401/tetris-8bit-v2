# Specification - Custom Input Sensitivity

## Goals
Allow the host to customize input sensitivity (DAS, ARR, and Soft Drop Speed) using clear, localized UI terms.

## UI Terms & Definitions
- **DAS (Delayed Auto Shift)** -> **首次移動延遲 (ms)**: 按住方向鍵後，方塊開始連續移動前的等待時間。數值越大越不容易誤觸連發。
- **ARR (Auto Repeat Rate)** -> **自動連發速度 (ms)**: 進入連發狀態後，每次移動的間隔時間。數值越小移動越快。
- **Soft Drop Speed** -> **軟下落速度 (ms)**: 按住「下方向鍵」時的下落間隔時間。數值越小下落越快。

## Feature Requirements
1. **Lobby Integration**: Add range sliders (bar) in `MultiplayerLobby.jsx` for the host to adjust these settings before starting.
2. **Synchronization**: Settings must be emitted to the server and broadcasted to all players (or specifically the host's session) so that the `Tetris.jsx` component uses the new values.
3. **Defaults**: 
   - DAS: Default 100ms, Range 50ms - 300ms.
   - ARR: Default 20ms, Range 10ms - 100ms.
   - Soft Drop: Default 15ms, Range 10ms - 100ms.

## Files to Modify
- `src/Constants.js`: Add default sensitivity constants.
- `src/MultiplayerLobby.jsx`: Add configuration UI.
- `server.js`: Ensure room settings include sensitivity.
- `src/Tetris.jsx`: Use dynamic sensitivity values from props.
