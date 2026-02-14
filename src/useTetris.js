import { useState, useEffect, useCallback, useRef } from 'react';
import { COLS, ROWS, TETROMINOS, INITIAL_DROP_SPEED, MIN_DROP_SPEED, SPEED_INCREMENT } from './Constants';
import { audio } from './audio';

const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

export const useTetris = (onStateChange, onAttack, { levelSpeedUp = true } = {}) => {
  const gridRef = useRef(createEmptyGrid());
  const activePieceRef = useRef(null);
  const [grid, setGrid] = useState(gridRef.current);
  const [activePiece, setActivePieceState] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [incomingGarbage, setIncomingGarbage] = useState(0);
  const isLockingRef = useRef(false);
  const isLandingRef = useRef(false);
  const lockTimerRef = useRef(null);
  
  const timerRef = useRef(null);
  const speedRef = useRef(INITIAL_DROP_SPEED);

  const setActivePiece = useCallback((piece) => {
    activePieceRef.current = piece;
    setActivePieceState(piece);
  }, []);

  const updateGrid = useCallback((newGrid) => {
    gridRef.current = newGrid;
    setGrid(newGrid);
  }, []);

  const getRandomPiece = useCallback(() => {
    const keys = Object.keys(TETROMINOS);
    const type = keys[Math.floor(Math.random() * keys.length)];
    const piece = TETROMINOS[type];
    return {
      type,
      shape: piece.shape,
      color: piece.color,
      pos: { x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2), y: 0 },
    };
  }, []);

  const checkCollision = useCallback((pos, shape, currentGrid) => {
    const gridToTest = currentGrid || gridRef.current;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (
            newX < 0 ||
            newX >= COLS ||
            newY >= ROWS ||
            (newY >= 0 && gridToTest[newY][newX] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const rotate = (shape) => {
    const rotated = shape[0].map((_, index) => shape.map((col) => col[index]).reverse());
    return rotated;
  };

  const updateGhostPos = useCallback((piece, currentGrid) => {
    if (!piece) return;
    let newY = piece.pos.y;
    while (!checkCollision({ x: piece.pos.x, y: newY + 1 }, piece.shape, currentGrid)) {
      newY++;
    }
    setGhostPos({ x: piece.pos.x, y: newY });
  }, [checkCollision]);

  const spawnPiece = useCallback((currentGrid) => {
    const gridToUse = currentGrid || gridRef.current;
    const piece = nextPiece || getRandomPiece();
    setNextPiece(getRandomPiece());
    
    if (checkCollision(piece.pos, piece.shape, gridToUse)) {
      setGameOver(true);
      audio.stopBGM();
      audio.playGameOver();
      setActivePiece(null);
      return null;
    }
    setActivePiece(piece);
    return piece;
  }, [nextPiece, getRandomPiece, checkCollision, setActivePiece]);

  useEffect(() => {
    if (activePiece) {
      updateGhostPos(activePiece);
    }
  }, [activePiece, grid, updateGhostPos]);

  const lockPiece = useCallback((pieceToLock) => {
    if (!pieceToLock || isLockingRef.current) return;
    isLockingRef.current = true;
    
    // Clear active piece immediately to prevent further movement
    setActivePiece(null);

    let newGrid = gridRef.current.map(row => [...row]);
    pieceToLock.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const gridY = pieceToLock.pos.y + y;
          const gridX = pieceToLock.pos.x + x;
          if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
            newGrid[gridY][gridX] = pieceToLock.color;
          }
        }
      });
    });

    // Clear lines
    let linesCleared = 0;
    const filteredGrid = newGrid.filter(row => {
      const isFull = row.every(cell => cell !== 0);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(0));
    }

    if (linesCleared > 0) {
      setScore(prevScore => {
        const newScore = prevScore + [0, 100, 300, 500, 800][linesCleared] * level;
        if (newScore > 0 && Math.floor(newScore / 1000) > Math.floor(prevScore / 1000)) {
          setLevel(prev => {
              const nextLevel = prev + 1;
              if (levelSpeedUp) {
                  speedRef.current = Math.max(MIN_DROP_SPEED, INITIAL_DROP_SPEED - (nextLevel * SPEED_INCREMENT));
              }
              return nextLevel;
          });
        }
        return newScore;
      });
      audio.playClear();
      if (onAttack) onAttack(linesCleared);
    } else {
      audio.playLand();
    }

    // Process incoming garbage if any
    let finalGrid = filteredGrid;
    if (incomingGarbage > 0) {
        const linesToAdd = Math.min(incomingGarbage, ROWS);
        finalGrid = filteredGrid.slice(linesToAdd);
        for (let i = 0; i < linesToAdd; i++) {
            const garbageRow = Array(COLS).fill('gray');
            const emptyCol = Math.floor(Math.random() * COLS);
            garbageRow[emptyCol] = 0;
            finalGrid.push(garbageRow);
        }
        setIncomingGarbage(prev => Math.max(0, prev - linesToAdd));
    }
    
    updateGrid(finalGrid);
    spawnPiece(finalGrid);
    isLockingRef.current = false;
    isLandingRef.current = false;
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, [level, updateGrid, spawnPiece, incomingGarbage, onAttack, setActivePiece, levelSpeedUp]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onStateChange) {
        onStateChange({ grid, score, gameOver });
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [grid, score, gameOver, onStateChange]);

  const movePiece = useCallback((dx, dy) => {
    if (gameOver || paused || !activePieceRef.current) return false;
    
    const currentPiece = activePieceRef.current;
    const newPos = { x: currentPiece.pos.x + dx, y: currentPiece.pos.y + dy };
    
    // Check collision
    if (checkCollision(newPos, currentPiece.shape)) {
      if (dy > 0) {
        // Landed on something
        if (!lockTimerRef.current) {
            isLandingRef.current = true;
            lockTimerRef.current = setTimeout(() => {
                const piece = activePieceRef.current;
                if (piece && !paused && !gameOver) {
                    if (checkCollision({ x: piece.pos.x, y: piece.pos.y + 1 }, piece.shape)) {
                        lockPiece(piece);
                    } else {
                        lockTimerRef.current = null;
                        isLandingRef.current = false;
                    }
                }
            }, 500);
        }
      }
      return false;
    }
    
    // Move successful
    if (dy > 0) {
        // Moving down successfully means we are not landing/locked yet
        if (lockTimerRef.current) {
            clearTimeout(lockTimerRef.current);
            lockTimerRef.current = null;
        }
        isLandingRef.current = false;
    } else if (isLandingRef.current) {
        // Moving sideways while landing resets the timer (Infinity Rule)
        if (lockTimerRef.current) {
            clearTimeout(lockTimerRef.current);
            lockTimerRef.current = setTimeout(() => {
                const piece = activePieceRef.current;
                if (piece && !paused && !gameOver) {
                    if (checkCollision({ x: piece.pos.x, y: piece.pos.y + 1 }, piece.shape)) {
                        lockPiece(piece);
                    } else {
                        lockTimerRef.current = null;
                        isLandingRef.current = false;
                    }
                }
            }, 500);
        }
    }

    if (dx !== 0) audio.playMove();
    setActivePiece({ ...currentPiece, pos: newPos });
    return true;
  }, [checkCollision, gameOver, lockPiece, paused, setActivePiece]);

  const rotatePiece = useCallback(() => {
    if (gameOver || paused || !activePieceRef.current) return;
    
    const currentPiece = activePieceRef.current;
    const rotatedShape = rotate(currentPiece.shape);
    
    // Wall Kicks (Basic SRS-like implementation)
    // Offsets: [x, y]
    const kicks = [
      { x: 0, y: 0 },   // Basic rotation
      { x: 1, y: 0 },   // Kick right
      { x: -1, y: 0 },  // Kick left
      { x: 0, y: -1 },  // Kick up (floor kick)
      { x: 2, y: 0 },   // Kick right 2 (for I piece mostly)
      { x: -2, y: 0 },  // Kick left 2
    ];

    for (const kick of kicks) {
      const kickedPos = { 
        x: currentPiece.pos.x + kick.x, 
        y: currentPiece.pos.y + kick.y 
      };

      if (!checkCollision(kickedPos, rotatedShape)) {
        const updatedPiece = { ...currentPiece, shape: rotatedShape, pos: kickedPos };
        audio.playRotate();
        setActivePiece(updatedPiece);
        
        // Reset lock timer if piece is landing (infinity ruleish)
        if (isLandingRef.current && lockTimerRef.current) {
            clearTimeout(lockTimerRef.current);
            lockTimerRef.current = setTimeout(() => {
                const piece = activePieceRef.current;
                if (piece && !paused && !gameOver) {
                    if (checkCollision({ x: piece.pos.x, y: piece.pos.y + 1 }, piece.shape)) {
                        lockPiece(piece);
                    } else {
                        lockTimerRef.current = null;
                        isLandingRef.current = false;
                    }
                }
            }, 500);
        }
        return;
      }
    }
  }, [checkCollision, gameOver, paused, setActivePiece, lockPiece]);

  const hardDrop = useCallback(() => {
    if (gameOver || paused || !activePieceRef.current) return;
    
    // Clear any existing lock timer to ensure immediate lock
    if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
    }
    isLandingRef.current = false;
    
    const currentPiece = activePieceRef.current;
    let newY = currentPiece.pos.y;
    while (!checkCollision({ x: currentPiece.pos.x, y: newY + 1 }, currentPiece.shape)) {
      newY++;
    }
    const droppedPiece = { ...currentPiece, pos: { ...currentPiece.pos, y: newY } };
    lockPiece(droppedPiece);
  }, [checkCollision, gameOver, lockPiece, paused]);

  const drop = useCallback(() => {
    movePiece(0, 1);
  }, [movePiece]);

  useEffect(() => {
    if (gameOver) return;
    if (paused) {
      audio.pauseBGM();
    } else {
      audio.resumeBGM();
    }
  }, [paused, gameOver]);

  useEffect(() => {
    if (gameOver || paused) return;
    
    timerRef.current = setInterval(drop, speedRef.current);
    return () => clearInterval(timerRef.current);
  }, [drop, gameOver, paused]);

  const startGame = useCallback(() => {
    audio.init();
    audio.stopBGM();
    audio.startBGM();
    const newGrid = createEmptyGrid();
    updateGrid(newGrid);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setIncomingGarbage(0);
    speedRef.current = INITIAL_DROP_SPEED;
    const firstPiece = getRandomPiece();
    setActivePiece(firstPiece);
    setNextPiece(getRandomPiece());
  }, [getRandomPiece, updateGrid, setActivePiece]);

  const receiveAttack = useCallback((lines) => {
      setIncomingGarbage(prev => prev + lines);
  }, []);

  useEffect(() => {
    return () => audio.stopBGM();
  }, []);

  return {
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
    setGameOver,
    movePiece,
    rotatePiece,
    hardDrop,
    startGame,
    receiveAttack,
  };
};
