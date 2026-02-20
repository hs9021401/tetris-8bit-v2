# Tetris 8-Bit V2

一個復古 8-bit 風格的俄羅斯方塊遊戲，採用 React + Vite 開發。

## 功能特色

- **單人遊戲** - 經典俄羅斯方塊玩法，等級遞增難度
- **本地雙人對戰** - 雙人同螢幕對戰
- **線上多人對戰** - 透過 Socket.io 進行線上對戰
- **垃圾機制** - 消除多行時可攻擊對手
- **幽靈方塊** - 顯示方塊落下位置
- **下一個方塊預覽** - 提前看到下一個方塊
- **自訂控制** - 可調整按鍵靈敏度（DAS/ARR）
- **8-bit 視覺風格** - 像素風格設計與陰影效果

## 操作說明

| 按鍵 | 功能 |
|------|------|
| ← → | 左右移動 |
| ↓ | 軟下降 |
| ↑ | 旋轉 |
| Space | 硬下降 |
| P | 暫停（單人模式） |

## 快速開始

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（單人模式）
npm run dev

# 啟動完整伺服器（含多人遊戲）
npm run start
```

## 技術棧

- **前端**: React 19 + Vite 7
- **後端**: Express + Socket.io
- **樣式**: Tailwind CSS 4
- **測試**: Vitest + Testing Library

## 專案結構

```
src/
├── Tetris.jsx         # 主遊戲元件
├── useTetris.js       # 遊戲邏輯鉤子
├── LocalMultiplayer.jsx  # 本地雙人模式
├── MultiplayerLobby.jsx  # 線上多人世界大廳
├── Constants.js       # 常數定義
├── audio.js          # 音效處理
└── App.jsx           # 應用入口

server.js             # Express + Socket.io 伺服器
```
