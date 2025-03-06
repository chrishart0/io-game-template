import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import * as dotenv from 'dotenv';
import { initGameState, addShrimp, removeShrimp, updateShrimpPosition, getGameState, processEating } from './game-state';

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

// Initialize the game state
initGameState();

// Interface for player input data
interface PlayerInput {
  x: number;
  y: number;
}

// Game loop configuration
const FRAME_RATE = 30; // Target 30 FPS
const FRAME_DELAY = Math.floor(1000 / FRAME_RATE); // ~33ms between frames
const LOG_INTERVAL = 1000; // Log once per second
let lastLogTime = 0; // Track when we last logged

// Socket.IO connection handler
io.on('connection', (socket) => {
  // Log new player connection
  console.log(`Player connected: ${socket.id}`);
  
  // Add player as shrimp to game state
  const shrimp = addShrimp(socket.id);
  
  // Broadcast current player count to all clients
  io.emit('player_count', io.engine.clientsCount);
  
  // Log current player count
  console.log(`Total players connected: ${io.engine.clientsCount}`);

  // Handle player input events (mouse movement)
  socket.on('input', (inputData: PlayerInput) => {
    // Update shrimp position based on player input
    updateShrimpPosition(socket.id, inputData.x, inputData.y);
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Remove shrimp from game state
    removeShrimp(socket.id);
    
    // Broadcast updated player count
    io.emit('player_count', io.engine.clientsCount);
    
    // Log current player count
    console.log(`Total players connected: ${io.engine.clientsCount}`);
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    playersConnected: io.engine.clientsCount 
  });
});

// Start the game loop
setInterval(() => {
  // Process game mechanics (eating food)
  processEating();
  
  // Get the current game state
  const currentState = getGameState();
  
  // Get current time
  const currentTime = Date.now();
  
  // Log only once per second to avoid console spam
  if (currentTime - lastLogTime >= LOG_INTERVAL) {
    console.log(`Game update: ${currentState.shrimps.length} shrimps, ${currentState.foods.length} food items`);
    lastLogTime = currentTime;
  }
  
  // Broadcast the game state to all connected clients
  io.emit('gameUpdate', currentState);
}, FRAME_DELAY);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server started`);
}); 