import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const ROOMS = new Map();
const GAME_DURATION = 180; // 3 minutes in seconds

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_lobby', () => {
    const roomsList = Array.from(ROOMS.entries()).map(([id, room]) => ({
      id,
      players: room.players.length,
      status: room.status,
      hostName: room.hostName
    }));
    socket.emit('lobby_rooms', roomsList);
  });

  socket.on('create_room', ({ roomName, playerName, sensitivity }) => {
    const roomId = roomName || `Room_${Math.random().toString(36).substr(2, 5)}`;
    if (ROOMS.has(roomId)) {
      socket.emit('error', 'Room already exists');
      return;
    }

    const room = {
      id: roomId,
      host: socket.id,
      hostName: playerName,
      players: [{ id: socket.id, name: playerName, grid: null, score: 0, gameOver: false }],
      status: 'waiting',
      timer: GAME_DURATION,
      startTime: null,
      sensitivity: sensitivity || { das: 100, arr: 20, softDrop: 15 }
    };

    ROOMS.set(roomId, room);
    socket.join(roomId);
    socket.emit('room_created', { roomId, players: room.players, sensitivity: room.sensitivity });
    io.emit('lobby_rooms', getLobbyRooms());
  });

  socket.on('update_settings', ({ roomId, sensitivity }) => {
    const room = ROOMS.get(roomId);
    if (room && room.host === socket.id && room.status === 'waiting') {
      room.sensitivity = sensitivity;
      io.to(roomId).emit('settings_updated', room.sensitivity);
    }
  });

  socket.on('join_room', ({ roomId, playerName }) => {
    const room = ROOMS.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.players.length >= 4) {
      socket.emit('error', 'Room is full');
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit('error', 'Game already started');
      return;
    }

    room.players.push({ id: socket.id, name: playerName, grid: null, score: 0, gameOver: false });
    socket.join(roomId);
    io.to(roomId).emit('player_joined', { players: room.players, sensitivity: room.sensitivity });
    io.emit('lobby_rooms', getLobbyRooms());
  });

  socket.on('start_game', (roomId) => {
    const room = ROOMS.get(roomId);
    if (room && room.host === socket.id) {
      room.status = 'playing';
      room.startTime = Date.now();
      room.timer = GAME_DURATION;
      io.to(roomId).emit('game_started', { 
        players: room.players, 
        duration: GAME_DURATION,
        sensitivity: room.sensitivity
      });
      
      const interval = setInterval(() => {
        if (!ROOMS.has(roomId) || room.status !== 'playing') {
          clearInterval(interval);
          return;
        }
        room.timer--;
        if (room.timer <= 0) {
          room.status = 'ended';
          io.to(roomId).emit('game_over_timeout', determineWinner(room));
          clearInterval(interval);
        } else {
          io.to(roomId).emit('timer_update', room.timer);
        }
      }, 1000);
    }
  });

  socket.on('update_state', ({ roomId, grid, score, gameOver }) => {
    const room = ROOMS.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.grid = grid;
      player.score = score;
      player.gameOver = gameOver;
      
      socket.to(roomId).emit('player_state_updated', {
        id: socket.id,
        grid,
        score,
        gameOver
      });

      if (gameOver) {
        const alivePlayers = room.players.filter(p => !p.gameOver);
        if (alivePlayers.length === 0 || (room.players.length > 1 && alivePlayers.length === 1)) {
           room.status = 'ended';
           io.to(roomId).emit('game_over_elimination', determineWinner(room));
        }
      }
    }
  });

  socket.on('attack', ({ roomId, lines }) => {
    // Attack system: send lines to other players
    let attackLines = 0;
    if (lines === 2) attackLines = 1;
    if (lines === 3) attackLines = 2;
    if (lines === 4) attackLines = 4;

    if (attackLines > 0) {
      socket.to(roomId).emit('get_attacked', { attackerId: socket.id, lines: attackLines });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    ROOMS.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          ROOMS.delete(roomId);
        } else {
          if (room.host === socket.id) {
            room.host = room.players[0].id;
            room.hostName = room.players[0].name;
          }
          io.to(roomId).emit('player_left', room.players);
        }
        io.emit('lobby_rooms', getLobbyRooms());
      }
    });
  });
});

function getLobbyRooms() {
  return Array.from(ROOMS.entries()).map(([id, room]) => ({
    id,
    players: room.players.length,
    status: room.status,
    hostName: room.hostName
  }));
}

function determineWinner(room) {
  const sorted = [...room.players].sort((a, b) => {
    if (a.gameOver && !b.gameOver) return 1;
    if (!a.gameOver && b.gameOver) return -1;
    return b.score - a.score;
  });
  return sorted[0];
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
