import { useState, useEffect, useCallback, useRef } from 'react';
import { COLS, ROWS, TETROMINOS, INITIAL_DROP_SPEED, MIN_DROP_SPEED, SPEED_INCREMENT } from './Constants';
import { audio } from './audio';

const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

export const useTetris = (onStateChange, onAttack) => {
  const [grid, setGrid] = useState(createEmptyGrid());
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

  const checkCollision = useCallback((pos, shape, currentGrid = grid) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (
            newX < 0 ||
            newX >= COLS ||
            newY >= ROWS ||
            (newY >= 0 && currentGrid[newY][newX] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, [grid]);

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

  const spawnPiece = useCallback((currentGrid = grid) => {
    const piece = nextPiece || getRandomPiece();
    const next = getRandomPiece();
    setNextPiece(next);
    
    if (checkCollision(piece.pos, piece.shape, currentGrid)) {
      setGameOver(true);
      audio.stopBGM();
      audio.playGameOver();
      return;
    }
    setActivePiece(piece);
    updateGhostPos(piece, currentGrid);
  }, [nextPiece, getRandomPiece, checkCollision, updateGhostPos, grid]);

  const addGarbageLines = useCallback((lines) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.slice(lines);
      for (let i = 0; i < lines; i++) {
        const garbageRow = Array(COLS).fill('gray');
        const emptyCol = Math.floor(Math.random() * COLS);
        garbageRow[emptyCol] = 0;
        newGrid.push(garbageRow);
      }
      return newGrid;
    });
  }, []);

  const lockPiece = useCallback((pieceToLock = activePiece) => {
    if (!pieceToLock) return;

    let newGrid = grid.map(row => [...row]);
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
      const newScore = score + [0, 100, 300, 500, 800][linesCleared] * level;
      setScore(newScore);
      audio.playClear();
      if (newScore > 0 && newScore % 1000 === 0) {
        setLevel(prev => prev + 1);
        speedRef.current = Math.max(MIN_DROP_SPEED, INITIAL_DROP_SPEED - (level * SPEED_INCREMENT));
      }
      if (onAttack) onAttack(linesCleared);
    } else {
      audio.playLand();
    }

    // Process incoming garbage if any
    if (incomingGarbage > 0) {
        const linesToAdd = incomingGarbage;
        const finalGrid = filteredGrid.slice(linesToAdd);
        for (let i = 0; i < linesToAdd; i++) {
            const garbageRow = Array(COLS).fill('gray');
            const emptyCol = Math.floor(Math.random() * COLS);
            garbageRow[emptyCol] = 0;
            finalGrid.push(garbageRow);
        }
        setGrid(finalGrid);
        setIncomingGarbage(0);
        spawnPiece(finalGrid);
    } else {
        setGrid(filteredGrid);
        spawnPiece(filteredGrid);
    }
  }, [activePiece, grid, level, score, spawnPiece, incomingGarbage, onAttack]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({ grid, score, gameOver });
    }
  }, [grid, score, gameOver, onStateChange]);

  const movePiece = useCallback((dx, dy) => {
    if (gameOver || paused || !activePiece) return false;
    
    const newPos = { x: activePiece.pos.x + dx, y: activePiece.pos.y + dy };
    if (!checkCollision(newPos, activePiece.shape)) {
      const updatedPiece = { ...activePiece, pos: newPos };
      setActivePiece(updatedPiece);
      updateGhostPos(updatedPiece, grid);
      if (dx !== 0) audio.playMove();
      return true;
    }

    if (dy > 0) {
      lockPiece(activePiece);
    }
    return false;
  }, [activePiece, checkCollision, gameOver, lockPiece, paused, updateGhostPos, grid]);

  const rotatePiece = useCallback(() => {
    if (gameOver || paused || !activePiece) return;
    
    const rotatedShape = rotate(activePiece.shape);
    if (!checkCollision(activePiece.pos, rotatedShape)) {
      const updatedPiece = { ...activePiece, shape: rotatedShape };
      setActivePiece(updatedPiece);
      updateGhostPos(updatedPiece, grid);
      audio.playRotate();
    }
  }, [activePiece, checkCollision, gameOver, paused, updateGhostPos, grid]);

  const drop = useCallback(() => {
    movePiece(0, 1);
  }, [movePiece]);

  const hardDrop = useCallback(() => {
    if (gameOver || paused || !activePiece) return;
    let newY = activePiece.pos.y;
    while (!checkCollision({ x: activePiece.pos.x, y: newY + 1 }, activePiece.shape)) {
      newY++;
    }
    const droppedPiece = { ...activePiece, pos: { ...activePiece.pos, y: newY } };
    lockPiece(droppedPiece);
  }, [activePiece, checkCollision, gameOver, lockPiece, paused]);

  useEffect(() => {
    if (gameOver) return;
    if (paused) {
      audio.pauseBGM();
    } else {
      if (activePiece) {
        audio.resumeBGM();
      }
    }
  }, [paused, gameOver, activePiece]);

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
    setGrid(newGrid);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setIncomingGarbage(0);
    speedRef.current = INITIAL_DROP_SPEED;
    const firstPiece = getRandomPiece();
    setActivePiece(firstPiece);
    setNextPiece(getRandomPiece());
    updateGhostPos(firstPiece, newGrid);
  }, [getRandomPiece, updateGhostPos]);

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
