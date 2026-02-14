import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import Tetris from './Tetris';
import { DEFAULT_SENSITIVITY } from './Constants';

const socket = io();

const MultiplayerLobby = () => {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState({});
  const [winner, setWinner] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [error, setError] = useState('');
  const [sensitivity, setSensitivity] = useState(DEFAULT_SENSITIVITY);

  useEffect(() => {
    socket.emit('join_lobby');

    socket.on('lobby_rooms', (roomsList) => {
      setRooms(roomsList);
    });

    socket.on('room_created', ({ roomId, players, sensitivity }) => {
      setCurrentRoom(roomId);
      setPlayers(players);
      if (sensitivity) setSensitivity(sensitivity);
    });

    socket.on('player_joined', ({ players, sensitivity: roomSensitivity }) => {
      setPlayers(players);
      if (roomSensitivity) setSensitivity(roomSensitivity);
    });

    socket.on('settings_updated', (newSensitivity) => {
      setSensitivity(newSensitivity);
    });

    socket.on('player_left', (roomPlayers) => {
      setPlayers(roomPlayers);
    });

    socket.on('game_started', ({ players, duration, sensitivity: startSensitivity }) => {
      setPlayers(players);
      setGameStarted(true);
      setTimeRemaining(duration);
      setWinner(null);
      setOtherPlayers({});
      if (startSensitivity) setSensitivity(startSensitivity);
    });

    socket.on('player_state_updated', ({ id, grid, score, gameOver }) => {
      setOtherPlayers(prev => ({
        ...prev,
        [id]: { grid, score, gameOver }
      }));
    });

    socket.on('timer_update', (time) => {
      setTimeRemaining(time);
    });

    socket.on('game_over_timeout', (winnerPlayer) => {
      setWinner(winnerPlayer);
      setGameStarted(false);
    });

    socket.on('game_over_elimination', (winnerPlayer) => {
        setWinner(winnerPlayer);
        setGameStarted(false);
    });

    socket.on('error', (msg) => {
      setError(msg);
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.off('lobby_rooms');
      socket.off('room_created');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_started');
      socket.off('player_state_updated');
      socket.off('timer_update');
      socket.off('game_over_timeout');
      socket.off('game_over_elimination');
      socket.off('error');
    };
  }, []);

  const createRoom = () => {
    if (!playerName) {
      setError('Please enter your name');
      return;
    }
    socket.emit('create_room', { roomName, playerName, sensitivity });
  };

  const updateSensitivity = (key, value) => {
    const newSensitivity = { ...sensitivity, [key]: parseInt(value) };
    setSensitivity(newSensitivity);
    socket.emit('update_settings', { roomId: currentRoom, sensitivity: newSensitivity });
  };

  const joinRoom = (roomId) => {
    if (!playerName) {
      setError('Please enter your name');
      return;
    }
    socket.emit('join_room', { roomId, playerName });
    setCurrentRoom(roomId);
  };

  const startGame = () => {
    socket.emit('start_game', currentRoom);
  };

  const handleStateChange = useCallback((state) => {
    if (gameStarted && currentRoom) {
      socket.emit('update_state', { roomId: currentRoom, ...state });
    }
  }, [gameStarted, currentRoom]);

  const handleAttack = useCallback((lines) => {
    if (gameStarted && currentRoom) {
      socket.emit('attack', { roomId: currentRoom, lines });
    }
  }, [gameStarted, currentRoom]);

  if (gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 font-mono text-white">
        <div className="text-2xl mb-4 text-yellow-400">Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex flex-col items-center">
            <h2 className="text-xl mb-2">{playerName} (You)</h2>
            <Tetris 
              multiplayer={true} 
              onStateChange={handleStateChange} 
              onAttack={handleAttack}
              socket={socket}
              sensitivity={sensitivity}
            />
          </div>
          <div className="flex flex-col gap-4">
            {players.filter(p => p.id !== socket.id).map(p => (
              <div key={p.id} className="border-2 border-gray-700 p-2 bg-gray-800 rounded">
                <h3 className="text-sm mb-1">{p.name} {otherPlayers[p.id]?.gameOver ? '(OUT)' : ''}</h3>
                <div className="text-xs mb-1">Score: {otherPlayers[p.id]?.score || 0}</div>
                <MiniGrid grid={otherPlayers[p.id]?.grid} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isHost = players[0]?.id === socket.id;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 font-mono text-white">
      <h1 className="text-5xl font-bold mb-8 text-yellow-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">TETRIS 8-BIT</h1>
      
      {error && <div className="bg-red-600 p-2 mb-4 rounded">{error}</div>}
      
      {winner && (
        <div className="bg-blue-600 p-4 mb-8 rounded-lg text-center animate-bounce">
          <h2 className="text-2xl font-bold">Winner: {winner.name}!</h2>
          <p>Score: {winner.score}</p>
        </div>
      )}

      {!currentRoom ? (
        <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg border-4 border-gray-700">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full p-2 mb-4 bg-gray-700 border-2 border-gray-600 outline-none"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <div className="flex gap-2 mb-8">
            <input
              type="text"
              placeholder="Room Name (Optional)"
              className="flex-1 p-2 bg-gray-700 border-2 border-gray-600 outline-none"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <button onClick={createRoom} className="px-4 bg-green-600 hover:bg-green-700 border-b-4 border-green-800 active:border-b-0 active:mt-1 transition-all">Create</button>
          </div>
          
          <div className="mb-8 p-4 bg-gray-900/50 rounded-lg border-2 border-gray-700">
            <h3 className="text-sm mb-4 text-gray-400 uppercase tracking-wider font-bold">預設操作靈敏度 (房主建立後可修改)</h3>
            <SensitivitySliders sensitivity={sensitivity} onChange={isHost ? updateSensitivity : null} disabled={true} />
          </div>

          <h2 className="text-xl mb-4 border-b-2 border-gray-700 pb-2">Available Rooms</h2>
          <div className="flex flex-col gap-2">
            {rooms.length === 0 ? <p className="text-gray-500 italic">No rooms available</p> : rooms.map(room => (
              <div key={room.id} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                <div>
                  <div className="font-bold">{room.id}</div>
                  <div className="text-xs text-gray-400">Host: {room.hostName} | Players: {room.players}/4</div>
                </div>
                <button 
                  onClick={() => joinRoom(room.id)}
                  disabled={room.players >= 4 || room.status !== 'waiting'}
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition-colors"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg border-4 border-gray-700">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h2 className="text-2xl mb-4 text-center">Room: {currentRoom}</h2>
              <div className="mb-8">
                <h3 className="text-lg mb-2 text-yellow-400">Players ({players.length}/4):</h3>
                <ul className="space-y-2">
                  {players.map(p => (
                    <li key={p.id} className="bg-gray-700 p-2 rounded flex justify-between">
                      <span>{p.name} {p.id === socket.id ? '(You)' : ''}</span>
                      {p.id === players[0]?.id && <span className="text-xs bg-yellow-600 px-1 rounded self-center">HOST</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => { socket.disconnect(); window.location.reload(); }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 border-b-4 border-red-800 active:border-b-0 active:mt-1 transition-all"
                >
                  Leave
                </button>
                {isHost && (
                  <button 
                    onClick={startGame}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 border-b-4 border-green-800 active:border-b-0 active:mt-1 transition-all"
                  >
                    Start Game
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-gray-900/50 p-4 rounded-lg border-2 border-gray-700">
              <h3 className="text-sm mb-4 text-gray-400 uppercase tracking-wider font-bold">遊戲操作靈敏度設定</h3>
              <SensitivitySliders sensitivity={sensitivity} onChange={isHost ? updateSensitivity : null} />
              {!isHost && <p className="text-[10px] text-gray-500 mt-4 italic">* 僅房主可調整設定</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SensitivitySliders = ({ sensitivity, onChange, disabled = false }) => {
  const configs = [
    { key: 'das', label: '首次移動延遲 (DAS)', min: 50, max: 300, step: 10, unit: 'ms', desc: '按住按鍵後，開始連發前的等待時間' },
    { key: 'arr', label: '自動連發速度 (ARR)', min: 10, max: 100, step: 5, unit: 'ms', desc: '連發時每次移動的間隔時間' },
    { key: 'softDrop', label: '軟下落速度', min: 10, max: 100, step: 5, unit: 'ms', desc: '按住下方向鍵時的下落速度' },
  ];

  return (
    <div className="space-y-6">
      {configs.map(cfg => (
        <div key={cfg.key} className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-bold">{cfg.label}</span>
            <span className="text-yellow-400 font-mono">{sensitivity[cfg.key]}{cfg.unit}</span>
          </div>
          <input
            type="range"
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            value={sensitivity[cfg.key]}
            disabled={disabled || !onChange}
            onChange={(e) => onChange && onChange(cfg.key, e.target.value)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-[10px] text-gray-500 leading-tight">{cfg.desc}</p>
        </div>
      ))}
    </div>
  );
};

const MiniGrid = ({ grid }) => {
  if (!grid || !Array.isArray(grid)) return <div className="w-20 h-40 bg-gray-900 flex items-center justify-center text-[8px] text-gray-700">Waiting...</div>;

  return (
    <div className="grid grid-cols-10 gap-[1px] bg-gray-900 border border-gray-700">
      {grid.map((row, y) => row.map((cell, x) => (
        <div 
          key={`${y}-${x}`}
          className={`w-[6px] h-[6px] ${cell === 0 ? 'bg-black' : cell === 'gray' ? 'bg-gray-500' : ''}`}
          style={{ backgroundColor: cell !== 0 && cell !== 'gray' ? cell : undefined }}
        />
      )))}
    </div>
  );
};

export default MultiplayerLobby;
