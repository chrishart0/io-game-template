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
const TARGET_FPS = 60; // Increase to 60 FPS for smoother gameplay
const FRAME_DELAY = Math.floor(1000 / TARGET_FPS); // ~16ms between frames
const LOG_INTERVAL = 1000; // Log once per second
let lastLogTime = 0; // Track when we last logged
let lastStateUpdate = 0; // Track last state update
const STATE_UPDATE_INTERVAL = 1000 / 30; // Update client state at 30 FPS (still smooth but less network traffic)

// Track previous shrimp count to detect collisions
let prevShrimpCount = 0;

// Function to log current game state
function logGameState() {
  const state = getGameState();
  console.log(`Current game state: ${state.shrimps.length} shrimps, ${state.foods.length} foods`);
  
  // Log all shrimps
  state.shrimps.forEach(shrimp => {
    console.log(`Shrimp ${shrimp.id}: position (${shrimp.x}, ${shrimp.y}), size: ${shrimp.size}, score: ${shrimp.score}`);
  });
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  // Log new player connection
  console.log(`Player connected: ${socket.id}`);
  
  // Add player as shrimp to game state
  const shrimp = addShrimp(socket.id);
  console.log(`Added new shrimp for player ${socket.id}: position (${shrimp.x}, ${shrimp.y}), size: ${shrimp.size}`);
  
  // Log current game state after adding the new shrimp
  logGameState();
  
  // Send an immediate game state update to the new player
  socket.emit('gameUpdate', getGameState());
  
  // Broadcast current player count to all clients
  io.emit('player_count', io.engine.clientsCount);
  
  // Log current player count
  console.log(`Total players connected: ${io.engine.clientsCount}`);

  // Handle player input events (mouse movement)
  socket.on('input', (inputData: PlayerInput) => {
    // Update shrimp position based on player input
    const updatedShrimp = updateShrimpPosition(socket.id, inputData.x, inputData.y);
    
    // Log position updates occasionally (1 in 30 updates to avoid spam)
    if (Math.random() < 0.033) { // ~once every 30 inputs
      if (updatedShrimp) {
        console.log(`Player ${socket.id} moved to (${updatedShrimp.x}, ${updatedShrimp.y})`);
      } else {
        console.warn(`Failed to update position for player ${socket.id}`);
      }
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Remove shrimp from game state
    removeShrimp(socket.id);
    
    // Log current game state after removing the shrimp
    logGameState();
    
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
  // Process game mechanics (eating food and shrimp collisions)
  processEating();
  
  // Get the current game state
  const currentState = getGameState();
  
  // Get current time
  const currentTime = Date.now();
  
  // Check for shrimp collisions by comparing previous count with current count
  const currentShrimpCount = currentState.shrimps.length;
  if (prevShrimpCount > currentShrimpCount) {
    // Some shrimps were eaten in collision processing
    const eatenCount = prevShrimpCount - currentShrimpCount;
    console.log(`${eatenCount} shrimp(s) were eaten in collisions`);
    
    // Log detailed game state when collisions occur
    logGameState();
  }
  prevShrimpCount = currentShrimpCount;
  
  // Only send game state updates at the specified interval (30 FPS)
  if (currentTime - lastStateUpdate >= STATE_UPDATE_INTERVAL) {
    // Send game state update to all clients
    io.emit('gameUpdate', currentState);
    lastStateUpdate = currentTime;
  }
  
  // Log only once per second to avoid console spam
  if (currentTime - lastLogTime >= LOG_INTERVAL) {
    console.log(`Game update: ${currentState.shrimps.length} shrimps, ${currentState.foods.length} food items`);
    lastLogTime = currentTime;
  }
}, FRAME_DELAY);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server started`);
}); 