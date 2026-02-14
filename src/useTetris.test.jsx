/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTetris } from './useTetris';
import * as Constants from './Constants';

// Mock Constants
vi.mock('./Constants', () => ({
  COLS: 10,
  ROWS: 20,
  BLOCK_SIZE: 30,
  INITIAL_DROP_SPEED: 1000,
  MIN_DROP_SPEED: 100,
  SPEED_INCREMENT: 50,
  TETROMINOS: {
    I: {
      shape: [[1, 1, 1, 1]],
      color: 'cyan',
    },
    O: {
      shape: [[1, 1], [1, 1]],
      color: 'yellow',
    }
  }
}));

// Mock Audio
vi.mock('./audio', () => ({
  audio: {
    init: vi.fn(),
    playMove: vi.fn(),
    playRotate: vi.fn(),
    playLand: vi.fn(),
    playClear: vi.fn(),
    playGameOver: vi.fn(),
    startBGM: vi.fn(),
    stopBGM: vi.fn(),
    pauseBGM: vi.fn(),
    resumeBGM: vi.fn(),
  }
}));

describe('useTetris Bug Reproduction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not lock piece when moving horizontally even if it hits a wall', () => {
    const { result } = renderHook(() => useTetris());
    
    act(() => {
      result.current.startGame();
    });

    // Move to the left wall
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.movePiece(-1, 0);
      }
    });

    expect(result.current.activePiece).not.toBeNull();
    expect(result.current.gameOver).toBe(false);
  });

  it('should not lock piece when multiple rapid moves occur', () => {
    const { result } = renderHook(() => useTetris());
    
    act(() => {
      result.current.startGame();
    });

    // Simulate rapid mixed movement including down moves that should NOT lock if possible
    act(() => {
      // Move down where there is space
      result.current.movePiece(0, 1);
      result.current.movePiece(0, 1);
      // Move side
      result.current.movePiece(1, 0);
      result.current.movePiece(-1, 0);
    });

    expect(result.current.activePiece).not.toBeNull();
    expect(result.current.gameOver).toBe(false);
  });

  it('should lock piece only when it cannot move down anymore', () => {
    const { result } = renderHook(() => useTetris());
    
    act(() => {
      result.current.startGame();
    });

    // Move to the bottom
    act(() => {
      for (let i = 0; i < 22; i++) {
        result.current.movePiece(0, 1);
      }
    });

    // After many down moves, it should have locked and a new piece spawned (or null if game over)
    // The first piece usually starts at y=0, grid is 20 rows.
    // Piece shape might have height 1-4.
    // So 22 moves is definitely enough to hit the bottom.
    
    // Check if score changed or piece changed
    expect(result.current.activePiece).not.toBeNull(); // New piece should spawn
  });
});
