import React, { useState, useRef } from 'react';
import Tetris from './Tetris';
import { DEFAULT_SENSITIVITY } from './Constants';

const LocalMultiplayer = ({ onBack }) => {
  const [winner, setWinner] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [levelSpeedUp, setLevelSpeedUp] = useState(true);
  
  const p1Ref = useRef(null);
  const p2Ref = useRef(null);

  const handleStart = () => {
    setWinner(null);
    setGameStarted(true);
  };

  const handleStateChange = (player, state) => {
    if (state.gameOver && gameStarted) {
      setWinner(player === 1 ? 'Player 2' : 'Player 1');
      setGameStarted(false);
    }
  };

  const handleAttack = (player, lines) => {
    if (!gameStarted) return;
    
    // Attack logic: 2 lines -> 1, 3 -> 2, 4 -> 4
    let attackLines = 0;
    if (lines === 2) attackLines = 1;
    if (lines === 3) attackLines = 2;
    if (lines === 4) attackLines = 4;

    if (attackLines > 0) {
        if (player === 1 && p2Ref.current) {
            p2Ref.current.receiveAttack(attackLines);
        } else if (player === 2 && p1Ref.current) {
            p1Ref.current.receiveAttack(attackLines);
        }
    }
  };

  const p1Controls = {
    left: ['KeyA'],
    right: ['KeyD'],
    down: ['KeyS'],
    rotate: ['KeyW'],
    hardDrop: ['ControlLeft'],
    pause: [] 
  };

  const p2Controls = {
    left: ['ArrowLeft'],
    right: ['ArrowRight'],
    down: ['ArrowDown'],
    rotate: ['ArrowUp'],
    hardDrop: ['ControlRight'],
    pause: []
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-mono p-4">
      <h1 className="text-4xl mb-4 text-yellow-400 pixel-text-shadow">LOCAL BATTLE</h1>
      
      {winner && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 p-8 border-4 border-white z-50 text-center shadow-lg">
          <h2 className="text-4xl font-bold mb-4">{winner} WINS!</h2>
          <button 
            onClick={handleStart}
            className="px-6 py-3 bg-yellow-500 text-black font-bold hover:bg-yellow-400 border-b-4 border-yellow-700 active:border-b-0 active:mt-1 transition-all"
          >
            REMATCH
          </button>
          <button 
            onClick={onBack}
            className="block mt-4 text-sm underline hover:text-gray-300"
          >
            Back to Menu
          </button>
        </div>
      )}

      {!gameStarted && !winner && (
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-6 p-3 bg-gray-800 rounded border border-gray-600">
                <input 
                    type="checkbox" 
                    id="localLevelSpeedUp"
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-2 cursor-pointer"
                    checked={levelSpeedUp}
                    onChange={(e) => setLevelSpeedUp(e.target.checked)}
                />
                <label htmlFor="localLevelSpeedUp" className="text-gray-300 text-sm cursor-pointer select-none">
                    啟用等級加速 (Level Speed Up)
                </label>
            </div>

            <div className="mb-8 flex gap-4">
                <button 
                    onClick={handleStart}
                    className="px-8 py-4 bg-green-600 hover:bg-green-500 text-xl font-bold border-b-4 border-green-800 active:border-b-0 active:mt-1 transition-all"
                >
                    START BATTLE
                </button>
                <button 
                    onClick={onBack}
                    className="px-8 py-4 bg-gray-600 hover:bg-gray-500 text-xl font-bold border-b-4 border-gray-800 active:border-b-0 active:mt-1 transition-all"
                >
                    BACK
                </button>
            </div>
        </div>
      )}

      <div className="flex gap-16 scale-75 md:scale-90 lg:scale-100 transition-transform origin-top">
        {/* Player 1 */}
        <div className="flex flex-col items-center">
            <h2 className="text-2xl mb-2 text-cyan-400 font-bold">PLAYER 1</h2>
            <div className="text-xs text-gray-400 mb-4">WASD + L.Ctrl</div>
            <div className={`border-4 border-cyan-400 p-2 ${winner === 'Player 1' ? 'animate-pulse' : ''}`}>
                {gameStarted && (
                    <Tetris 
                        ref={p1Ref}
                        multiplayer={true} // Using multiplayer mode for UI layout (no pause menu etc)
                        onStateChange={(state) => handleStateChange(1, state)}
                        onAttack={(lines) => handleAttack(1, lines)}
                        customControls={p1Controls}
                        sensitivity={DEFAULT_SENSITIVITY}
                        levelSpeedUp={levelSpeedUp}
                    />
                )}
                {!gameStarted && <div className="w-[300px] h-[600px] bg-gray-800 flex items-center justify-center text-gray-500">READY</div>}
            </div>
        </div>

        {/* VS Separator */}
        <div className="flex flex-col justify-center items-center">
            <div className="w-1 h-full bg-gray-700 absolute top-0 bottom-0 z-0"></div>
            <div className="bg-red-600 text-white font-bold text-3xl p-4 rounded-full z-10 border-4 border-white pixel-text-shadow">VS</div>
        </div>

        {/* Player 2 */}
        <div className="flex flex-col items-center">
            <h2 className="text-2xl mb-2 text-green-400 font-bold">PLAYER 2</h2>
            <div className="text-xs text-gray-400 mb-4">ARROWS + R.Ctrl</div>
            <div className={`border-4 border-green-400 p-2 ${winner === 'Player 2' ? 'animate-pulse' : ''}`}>
                {gameStarted && (
                    <Tetris 
                        ref={p2Ref}
                        multiplayer={true}
                        onStateChange={(state) => handleStateChange(2, state)}
                        onAttack={(lines) => handleAttack(2, lines)}
                        customControls={p2Controls}
                        sensitivity={DEFAULT_SENSITIVITY}
                        levelSpeedUp={levelSpeedUp}
                    />
                )}
                {!gameStarted && <div className="w-[300px] h-[600px] bg-gray-800 flex items-center justify-center text-gray-500">READY</div>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LocalMultiplayer;
