/**
 * Socket.IO Game Server
 * 
 * This module implements the WebSocket server using Socket.IO and Express.
 * It handles player connections, input processing, and game state broadcasting.
 * The server maintains the authoritative game state and runs the game loop.
 * 
 * Key responsibilities:
 * - Socket.IO server setup and configuration
 * - Player connection/disconnection handling
 * - Input event processing
 * - Game loop execution
 * - State broadcasting to clients
 * 
 * @module server
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import * as dotenv from 'dotenv';
import { 
  initGameState, 
  addShrimp, 
  removeShrimp, 
  updateShrimpPosition, 
  getGameState, 
  processEating 
} from './game-state';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Load environment variables
dotenv.config();

/**
 * Server configuration interface
 * Centralizes all server-specific configuration parameters
 */
interface ServerConfig {
  port: number;            // Server port number
  targetFps: number;       // Target frame rate for game loop
  stateUpdateRate: number; // Rate to send updates to clients (fps)
  logInterval: number;     // How often to log game state (ms)
}

/**
 * Define server configuration with defaults
 * All timing values derived from this configuration
 */
const CONFIG: ServerConfig = {
  port: Number(process.env.PORT) || 4000,
  targetFps: 60,                          // Target frame rate for game loop
  stateUpdateRate: 30,                    // Rate to send updates to clients (fps)
  logInterval: 1000,                      // Log interval in milliseconds
};

// Calculate timing parameters from configuration
const FRAME_DELAY = Math.floor(1000 / CONFIG.targetFps);
const STATE_UPDATE_INTERVAL = 1000 / CONFIG.stateUpdateRate;

// =============================================================================
// SERVER SETUP
// =============================================================================

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

/**
 * Configure CORS for Socket.IO
 * In production, this should be restricted to your frontend URL
 */
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to your frontend URL
    methods: ['GET', 'POST']
  }
});

// Initialize the game state
initGameState();

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Player input data interface
 * Represents mouse movement data from clients
 */
interface PlayerInput {
  x: number; // Target X position from mouse
  y: number; // Target Y position from mouse
}

// =============================================================================
// TIMING AND LOGGING
// =============================================================================

// Time tracking variables
let lastLogTime = 0;
let lastStateUpdate = 0;

// Track previous shrimp count to detect collisions
let prevShrimpCount = 0;

/**
 * Logs the current game state including all shrimps
 * Used for debugging and server monitoring
 */
function logGameState(): void {
  const state = getGameState();
  console.log(`Current game state: ${state.shrimps.length} shrimps, ${state.foods.length} foods`);
  
  // Log all shrimps
  state.shrimps.forEach(shrimp => {
    console.log(`Shrimp ${shrimp.id}: position (${shrimp.x}, ${shrimp.y}), size: ${shrimp.size}, score: ${shrimp.score}`);
  });
}

// =============================================================================
// SOCKET.IO EVENT HANDLERS
// =============================================================================

/**
 * Socket.IO connection handler
 * Manages the entire player lifecycle:
 * 1. Connection and shrimp creation
 * 2. Input processing
 * 3. Disconnection and cleanup
 */
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

  /**
   * Handle player input events (mouse movement)
   * Updates the player's shrimp position based on input
   */
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

  /**
   * Handle player disconnect
   * Removes player from game and updates all clients
   */
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

// =============================================================================
// REST API ENDPOINTS
// =============================================================================

/**
 * Basic health check endpoint
 * Useful for monitoring and container health checks
 */
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    playersConnected: io.engine.clientsCount 
  });
});

// =============================================================================
// GAME LOOP
// =============================================================================

/**
 * Main game loop
 * Runs at the configured FPS (CONFIG.targetFps)
 * Handles:
 * 1. Game mechanics processing
 * 2. State broadcasting to clients
 * 3. Collision detection
 * 4. Debug logging
 */
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
  if (currentTime - lastLogTime >= CONFIG.logInterval) {
    console.log(`Game update: ${currentState.shrimps.length} shrimps, ${currentState.foods.length} food items`);
    lastLogTime = currentTime;
  }
}, FRAME_DELAY);

// =============================================================================
// SERVER STARTUP
// =============================================================================

/**
 * Start the server
 * Initializes the HTTP server on the configured port
 */
server.listen(CONFIG.port, () => {
  console.log(`Server running on port ${CONFIG.port}`);
  console.log(`Socket.IO server started`);
}); 