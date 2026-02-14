import { useState } from 'react'
import Tetris from './Tetris'
import MultiplayerLobby from './MultiplayerLobby'
import LocalMultiplayer from './LocalMultiplayer'

function App() {
  const [mode, setMode] = useState(null); // 'single', 'multi', 'local'

  if (mode === 'single') {
    return (
      <div className="relative">
        <button 
          onClick={() => setMode(null)}
          className="absolute top-4 left-4 z-[100] px-4 py-2 bg-gray-800 text-white border-2 border-gray-600 hover:bg-gray-700 font-mono"
        >
          BACK
        </button>
        <Tetris />
      </div>
    );
  }

  if (mode === 'multi') {
    return (
      <div className="relative">
        <button 
          onClick={() => {
            // Force reload to clean up socket connections if needed
            window.location.reload();
          }}
          className="absolute top-4 left-4 z-[100] px-4 py-2 bg-gray-800 text-white border-2 border-gray-600 hover:bg-gray-700 font-mono"
        >
          BACK
        </button>
        <MultiplayerLobby />
      </div>
    );
  }

  if (mode === 'local') {
    return <LocalMultiplayer onBack={() => setMode(null)} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 font-mono text-white p-4">
      <h1 className="text-6xl font-bold mb-12 text-yellow-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] text-center">
        TETRIS 8-BIT
      </h1>
      
      <div className="flex flex-col gap-6 w-full max-w-xs">
        <button 
          onClick={() => setMode('single')}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 border-b-8 border-blue-900 active:border-b-0 active:mt-2 transition-all text-xl font-bold"
        >
          SINGLE PLAYER
        </button>

        <button 
          onClick={() => setMode('local')}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 border-b-8 border-purple-900 active:border-b-0 active:mt-2 transition-all text-xl font-bold"
        >
          LOCAL BATTLE
        </button>
        
        <button 
          onClick={() => setMode('multi')}
          className="w-full py-4 bg-green-600 hover:bg-green-700 border-b-8 border-green-900 active:border-b-0 active:mt-2 transition-all text-xl font-bold"
        >
          MULTIPLAYER
        </button>
      </div>

      <div className="mt-16 text-gray-500 text-sm">
        CONTROLS: ARROWS TO MOVE | UP TO ROTATE | SPACE TO DROP
      </div>
    </div>
  )
}

export default App
