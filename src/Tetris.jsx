import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTetris } from './useTetris';
import { COLS, ROWS, BLOCK_SIZE, DEFAULT_SENSITIVITY } from './Constants';

const Tetris = forwardRef(({ multiplayer, onStateChange, onAttack, socket, sensitivity = DEFAULT_SENSITIVITY, customControls, levelSpeedUp = true }, ref) => {
  const {
    grid,
    activePiece,
    nextPiece,
    score,
    level,
    gameOver,
    paused,
    ghostPos,
    incomingGarbage,
    setPaused,
    movePiece,
    rotatePiece,
    hardDrop,
    startGame,
    receiveAttack,
  } = useTetris(onStateChange, onAttack, { levelSpeedUp });

  useImperativeHandle(ref, () => ({
    receiveAttack
  }));

  useEffect(() => {
    if (multiplayer && socket) {
      const handleGetAttacked = ({ lines }) => {
        receiveAttack(lines);
      };
      socket.on('get_attacked', handleGetAttacked);
      
      return () => {
        socket.off('get_attacked', handleGetAttacked);
      };
    }
  }, [multiplayer, socket, receiveAttack]);

  useEffect(() => {
    if (multiplayer) {
      startGame();
    }
  }, [multiplayer, startGame]);

  useEffect(() => {
    const keysPressed = {};
    const lastActionTime = {
      left: 0,
      right: 0,
      down: 0
    };

    const { das, arr, softDrop } = sensitivity;

    const defaultControls = {
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
      down: ['ArrowDown'],
      rotate: ['ArrowUp'],
      hardDrop: ['Space'],
      pause: ['KeyP']
    };

    const controls = customControls || defaultControls;

    const getAction = (code) => {
      for (const [action, codes] of Object.entries(controls)) {
        if (codes.includes(code)) return action;
      }
      return null;
    };

    const handleKeyDown = (e) => {
      if (gameOver) return;
      
      const action = getAction(e.code);
      if (action) {
        e.preventDefault();
      }

      if (keysPressed[e.code]) return;
      keysPressed[e.code] = true;

      const now = Date.now();

      switch (action) {
        case 'left':
          movePiece(-1, 0);
          lastActionTime['left'] = now;
          break;
        case 'right':
          movePiece(1, 0);
          lastActionTime['right'] = now;
          break;
        case 'down':
          movePiece(0, 1);
          lastActionTime['down'] = now;
          break;
        case 'rotate':
          rotatePiece();
          break;
        case 'hardDrop':
          hardDrop();
          break;
        case 'pause':
          if (!multiplayer) setPaused(prev => !prev);
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      keysPressed[e.code] = false;
    };

    const moveLoop = () => {
      if (paused || gameOver) return;

      const now = Date.now();
      
      ['left', 'right'].forEach(action => {
        const codes = controls[action];
        const isPressed = codes.some(code => keysPressed[code]);
        
        if (isPressed) {
          const elapsed = now - lastActionTime[action];
          if (elapsed >= das) {
            movePiece(action === 'left' ? -1 : 1, 0);
            lastActionTime[action] = now - (das - arr);
          }
        }
      });

      const downCodes = controls['down'];
      if (downCodes.some(code => keysPressed[code])) {
        const elapsed = now - lastActionTime['down'];
        if (elapsed >= softDrop) {
          movePiece(0, 1);
          lastActionTime['down'] = now;
        }
      }
    };

    const interval = setInterval(moveLoop, 16);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [movePiece, rotatePiece, hardDrop, gameOver, paused, setPaused, multiplayer, sensitivity, customControls]);

  const renderGrid = () => {
    return grid.map((row, y) =>
      row.map((cell, x) => (
        <div
          key={`cell-${y}-${x}`}
          className="absolute border border-white/5"
          style={{
            width: BLOCK_SIZE,
            height: BLOCK_SIZE,
            left: x * BLOCK_SIZE,
            top: y * BLOCK_SIZE,
            backgroundColor: cell === 'gray' ? '#666' : (cell || 'transparent'),
            boxShadow: cell ? 'inset 2px 2px 0px rgba(255,255,255,0.3), inset -2px -2px 0px rgba(0,0,0,0.3)' : 'none',
          }}
        />
      ))
    );
  };

  const renderActivePiece = () => {
    if (!activePiece) return null;
    return activePiece.shape.map((row, y) =>
      row.map((cell, x) => {
        if (cell === 0) return null;
        return (
          <div
            key={`active-${y}-${x}`}
            className="absolute transition-all duration-100 ease-out"
            style={{
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              left: (activePiece.pos.x + x) * BLOCK_SIZE,
              top: (activePiece.pos.y + y) * BLOCK_SIZE,
              backgroundColor: activePiece.color,
              boxShadow: 'inset 2px 2px 0px rgba(255,255,255,0.5), inset -2px -2px 0px rgba(0,0,0,0.3)',
              zIndex: 10,
            }}
          />
        );
      })
    );
  };

  const renderGhostPiece = () => {
    if (!activePiece || gameOver || paused) return null;
    return activePiece.shape.map((row, y) =>
      row.map((cell, x) => {
        if (cell === 0) return null;
        return (
          <div
            key={`ghost-${y}-${x}`}
            className="absolute border-2 border-dashed transition-all duration-100 ease-out"
            style={{
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              left: (ghostPos.x + x) * BLOCK_SIZE,
              top: (ghostPos.y + y) * BLOCK_SIZE,
              borderColor: activePiece.color,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              opacity: 0.3,
              zIndex: 5,
            }}
          />
        );
      })
    );
  };

  const renderNextPiece = () => {
    if (!nextPiece) return null;
    return (
      <div className="relative" style={{ width: BLOCK_SIZE * 4, height: BLOCK_SIZE * 4 }}>
        {nextPiece.shape.map((row, y) =>
          row.map((cell, x) => {
            if (cell === 0) return null;
            return (
              <div
                key={`next-${y}-${x}`}
                className="absolute"
                style={{
                  width: BLOCK_SIZE * 0.8,
                  height: BLOCK_SIZE * 0.8,
                  left: x * BLOCK_SIZE * 0.8,
                  top: y * BLOCK_SIZE * 0.8,
                  backgroundColor: nextPiece.color,
                  boxShadow: 'inset 1px 1px 0px rgba(255,255,255,0.5), inset -1px -1px 0px rgba(0,0,0,0.3)',
                }}
              />
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center ${multiplayer ? '' : 'min-h-screen'} bg-black text-white p-4`}>
      {!multiplayer && <h1 className="text-4xl mb-8 pixel-text-shadow text-yellow-400">TETRIS 8-BIT</h1>}
      
      <div className="flex gap-8 scale-90 sm:scale-100">
        <div className="flex gap-2">
            {multiplayer && (
                <div 
                    className="flex flex-col-reverse justify-start bg-gray-900 border border-gray-700 relative overflow-hidden" 
                    style={{ width: 12, height: ROWS * BLOCK_SIZE }}
                >
                    <div 
                        className="bg-red-600 w-full transition-all duration-300 ease-out absolute bottom-0" 
                        style={{ height: `${Math.min(incomingGarbage, ROWS) * 100 / ROWS}%` }} 
                    />
                    {/* Grid lines for the bar */}
                    {Array.from({ length: ROWS }).map((_, i) => (
                        <div key={i} className="w-full border-t border-black/20" style={{ height: `${100/ROWS}%` }} />
                    ))}
                </div>
            )}
            <div 
            className="relative pixel-border bg-gray-900 overflow-hidden"
            style={{ width: COLS * BLOCK_SIZE, height: ROWS * BLOCK_SIZE }}
            >
            {renderGrid()}
            {renderGhostPiece()}
            {renderActivePiece()}
            
            {(gameOver || (!activePiece && !multiplayer)) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
                {gameOver && <h2 className="text-2xl text-red-500 mb-4">GAME OVER</h2>}
                {!multiplayer && (
                    <button 
                    onClick={startGame}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 pixel-border cursor-pointer transition-colors"
                    >
                    {gameOver ? 'RETRY' : 'START'}
                    </button>
                )}
                </div>
            )}

            {paused && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
                <h2 className="text-2xl text-yellow-400">PAUSED</h2>
                </div>
            )}
            </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="pixel-border p-4 bg-gray-800">
            <h3 className="text-xs mb-2 text-gray-400">NEXT</h3>
            <div className="flex items-center justify-center h-20 w-20 bg-black/50">
              {renderNextPiece()}
            </div>
          </div>

          <div className="pixel-border p-4 bg-gray-800">
            <h3 className="text-xs mb-2 text-gray-400">SCORE</h3>
            <p className="text-lg text-yellow-400">{score.toString().padStart(6, '0')}</p>
          </div>

          <div className="pixel-border p-4 bg-gray-800">
            <h3 className="text-xs mb-2 text-gray-400">LEVEL</h3>
            <p className="text-lg text-blue-400">{level}</p>
          </div>

          {!multiplayer && (
              <div className="mt-auto text-[10px] text-gray-500 leading-relaxed">
                ARROWS: MOVE & ROTATE<br />
                SPACE: HARD DROP<br />
                P: PAUSE
              </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Tetris;
// Fixed forwardRef syntax
