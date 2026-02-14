import { useState, useEffect, useCallback, useRef } from 'react';
import { COLS, ROWS, TETROMINOS, INITIAL_DROP_SPEED, MIN_DROP_SPEED, SPEED_INCREMENT } from './Constants';
import { audio } from './audio';

const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

export const useTetris = (onStateChange, onAttack) => {
  const gridRef = useRef(createEmptyGrid());
  const [grid, setGrid] = useState(gridRef.current);
  const [activePiece, setActivePiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [incomingGarbage, setIncomingGarbage] = useState(0);
  
  const timerRef = useRef(null);
  const speedRef = useRef(INITIAL_DROP_SPEED);

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
    setActivePiece(() => {
      const piece = nextPiece || getRandomPiece();
      setNextPiece(getRandomPiece());
      
      if (checkCollision(piece.pos, piece.shape, gridToUse)) {
        setGameOver(true);
        audio.stopBGM();
        audio.playGameOver();
        return null;
      }
      return piece;
    });
  }, [nextPiece, getRandomPiece, checkCollision]);

  useEffect(() => {
    if (activePiece) {
      updateGhostPos(activePiece);
    }
  }, [activePiece, grid, updateGhostPos]);

  const addGarbageLines = useCallback((lines) => {
    const newGrid = gridRef.current.slice(lines);
    for (let i = 0; i < lines; i++) {
      const garbageRow = Array(COLS).fill('gray');
      const emptyCol = Math.floor(Math.random() * COLS);
      garbageRow[emptyCol] = 0;
      newGrid.push(garbageRow);
    }
    updateGrid(newGrid);
  }, [updateGrid]);

  const lockPiece = useCallback((pieceToLock) => {
    if (!pieceToLock) return;

    let newGrid = gridRef.current.map(row => [...row]);
    pieceToLock.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const gridY = pieceToLock.pos.y + y;
          const gridX = pieceToLock.pos.x + x;
          if (gridY >= 0) {
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
        if (newScore > 0 && newScore % 1000 === 0) {
          setLevel(prev => prev + 1);
          speedRef.current = Math.max(MIN_DROP_SPEED, INITIAL_DROP_SPEED - (level * SPEED_INCREMENT));
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
        const linesToAdd = incomingGarbage;
        finalGrid = filteredGrid.slice(linesToAdd);
        for (let i = 0; i < linesToAdd; i++) {
            const garbageRow = Array(COLS).fill('gray');
            const emptyCol = Math.floor(Math.random() * COLS);
            garbageRow[emptyCol] = 0;
            finalGrid.push(garbageRow);
        }
        setIncomingGarbage(0);
    }
    
    updateGrid(finalGrid);
    spawnPiece(finalGrid);
  }, [level, updateGrid, spawnPiece, incomingGarbage, onAttack]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onStateChange) {
        onStateChange({ grid, score, gameOver });
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [grid, score, gameOver, onStateChange]);

  const movePiece = useCallback((dx, dy) => {
    if (gameOver || paused) return false;
    
    let canMove = true;
    setActivePiece(prev => {
        if (!prev) return null;
        const newPos = { x: prev.pos.x + dx, y: prev.pos.y + dy };
        if (checkCollision(newPos, prev.shape)) {
          canMove = false;
          return prev;
        }
        
        if (dx !== 0) audio.playMove();
        return { ...prev, pos: newPos };
    });

    // Wait, the 'canMove' flag will be correct because React executes the updater synchronously 
    // when it's called outside of a render phase (like in an event handler).
    // HOWEVER, if we are at the bottom and dy > 0, we should lock.
    if (!canMove && dy > 0) {
      setActivePiece(prev => {
        if (prev) lockPiece(prev);
        return null;
      });
    }
    return canMove;
  }, [checkCollision, gameOver, lockPiece, paused]);

  const rotatePiece = useCallback(() => {
    if (gameOver || paused) return;
    
    setActivePiece(prev => {
        if (!prev) return null;
        const rotatedShape = rotate(prev.shape);
        if (!checkCollision(prev.pos, rotatedShape)) {
          const updatedPiece = { ...prev, shape: rotatedShape };
          audio.playRotate();
          return updatedPiece;
        }
        return prev;
    });
  }, [checkCollision, gameOver, paused]);

  const hardDrop = useCallback(() => {
    if (gameOver || paused) return;
    setActivePiece(prev => {
        if (!prev) return null;
        let newY = prev.pos.y;
        while (!checkCollision({ x: prev.pos.x, y: newY + 1 }, prev.shape)) {
          newY++;
        }
        const droppedPiece = { ...prev, pos: { ...prev.pos, y: newY } };
        lockPiece(droppedPiece);
        return null;
    });
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
  }, [getRandomPiece, updateGrid]);

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
