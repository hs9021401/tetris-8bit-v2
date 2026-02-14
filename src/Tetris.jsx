import React, { useEffect } from 'react';
import { useTetris } from './useTetris';
import { COLS, ROWS, BLOCK_SIZE } from './Constants';

const Tetris = ({ multiplayer, onStateChange, onAttack, socket }) => {
  const {
    grid,
    activePiece,
    nextPiece,
    score,
    level,
    gameOver,
    paused,
    ghostPos,
    setPaused,
    movePiece,
    rotatePiece,
    hardDrop,
    startGame,
    receiveAttack,
  } = useTetris(onStateChange, onAttack);

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
      ArrowLeft: 0,
      ArrowRight: 0,
      ArrowDown: 0
    };

    const MOVE_DELAY = 100;
    const MOVE_REPEAT = 20;
    const SOFT_DROP_REPEAT = 15;

    const handleKeyDown = (e) => {
      if (gameOver) return;
      
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (keysPressed[e.key]) return;
      keysPressed[e.key] = true;

      const now = Date.now();

      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          lastActionTime['ArrowLeft'] = now;
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          lastActionTime['ArrowRight'] = now;
          break;
        case 'ArrowDown':
          movePiece(0, 1);
          lastActionTime['ArrowDown'] = now;
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        case ' ':
          hardDrop();
          break;
        case 'p':
        case 'P':
          if (!multiplayer) setPaused(prev => !prev);
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      keysPressed[e.key] = false;
    };

    const moveLoop = () => {
      if (paused || gameOver) return;

      const now = Date.now();
      
      ['ArrowLeft', 'ArrowRight'].forEach(key => {
        if (keysPressed[key]) {
          const elapsed = now - lastActionTime[key];
          if (elapsed >= MOVE_DELAY) {
            movePiece(key === 'ArrowLeft' ? -1 : 1, 0);
            lastActionTime[key] = now - (MOVE_DELAY - MOVE_REPEAT);
          }
        }
      });

      if (keysPressed['ArrowDown']) {
        const elapsed = now - lastActionTime['ArrowDown'];
        if (elapsed >= SOFT_DROP_REPEAT) {
          movePiece(0, 1);
          lastActionTime['ArrowDown'] = now;
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
  }, [movePiece, rotatePiece, hardDrop, gameOver, paused, setPaused, multiplayer]);

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
};

export default Tetris;
