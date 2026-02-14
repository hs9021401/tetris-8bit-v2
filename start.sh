#!/bin/bash

# 切換到腳本所在目錄 (確保無論從哪裡執行都能找到專案)
cd "$(dirname "$0")"

echo "🚀 Starting Tetris 8-Bit Server and Client..."

# 執行 npm start (它會同時啟動後端與前端)
npm start

# 如果你想讓視窗保持開啟以檢視錯誤 (可選)
# read -p "Press enter to close"
