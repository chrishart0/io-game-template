import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to your frontend URL
    methods: ['GET', 'POST']
  }
});

// Track connected players
interface Player {
  id: string;
  connectionTime: Date;
  position?: {
    x: number;
    y: number;
  };
}

// Interface for player input data
interface PlayerInput {
  x: number;
  y: number;
}

const connectedPlayers: Map<string, Player> = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  // Log new player connection
  console.log(`Player connected: ${socket.id}`);
  
  // Add player to connected players map
  connectedPlayers.set(socket.id, {
    id: socket.id,
    connectionTime: new Date()
  });
  
  // Broadcast current player count to all clients
  io.emit('player_count', connectedPlayers.size);
  
  // Log current player count
  console.log(`Total players connected: ${connectedPlayers.size}`);

  // Handle player input events (mouse movement)
  socket.on('input', (inputData: PlayerInput) => {
    // Log received input coordinates
    console.log(`Player ${socket.id} moved to x: ${inputData.x}, y: ${inputData.y}`);
    
    // Update player position in the connected players map
    const player = connectedPlayers.get(socket.id);
    if (player) {
      player.position = {
        x: inputData.x,
        y: inputData.y
      };
      connectedPlayers.set(socket.id, player);
    }
    
    // Here you would typically update the game state and broadcast to other players
    // This will be implemented in future milestones
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Remove player from connected players map
    connectedPlayers.delete(socket.id);
    
    // Broadcast updated player count
    io.emit('player_count', connectedPlayers.size);
    
    // Log current player count
    console.log(`Total players connected: ${connectedPlayers.size}`);
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    playersConnected: connectedPlayers.size 
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server started`);
}); 