/**
 * Global Type Definitions
 * 
 * This file aggregates key types from both frontend and backend
 * for easy reference. It's specifically designed to help Claude/Cursor
 * understand the project's type system in one place.
 * 
 * Note: This file is for documentation only - the actual types are defined
 * in their respective modules.
 */

/**
 * ------------------
 * BACKEND TYPES
 * ------------------
 */

/**
 * Server configuration parameters
 * @see backend/src/server.ts
 */
interface ServerConfig {
  port: number;            // Server port number
  targetFps: number;       // Target frame rate for the game loop
  stateUpdateRate: number; // Rate to send updates to clients (fps)
  logInterval: number;     // How often to log game state (ms)
}

/**
 * Game configuration parameters
 * @see backend/src/game-state.ts
 */
interface GameConfig {
  mapWidth: number;        // Game world width
  mapHeight: number;       // Game world height
  initialShrimpSize: number; // Starting size for new players
  maxShrimpSize: number;   // Maximum possible shrimp size
  initialFoodCount: number; // Food items at game start
  minFoodSize: number;     // Minimum food size
  maxFoodSize: number;     // Maximum food size
  growthPerFood: number;   // Size increase per food eaten
  growthPerShrimp: number; // Size increase per shrimp eaten
  scorePerFood: number;    // Score gain per food eaten
  scorePerShrimp: number;  // Score gain per shrimp eaten
}

/**
 * Player input data from clients
 * @see backend/src/server.ts
 */
interface PlayerInput {
  x: number;  // Target X position from mouse
  y: number;  // Target Y position from mouse
}

/**
 * Player entity (shrimp)
 * @see backend/src/game-state.ts
 */
interface Shrimp {
  id: string;   // Socket ID of the player
  x: number;    // Current X position
  y: number;    // Current Y position
  size: number; // Current size (grows with eating)
  score: number; // Player's score
}

/**
 * Food entity in the game world
 * @see backend/src/game-state.ts
 */
interface Food {
  x: number;    // X position on the map
  y: number;    // Y position on the map
  size: number; // Size of the food item
}

/**
 * Complete game state
 * @see backend/src/game-state.ts
 */
interface GameState {
  shrimps: Shrimp[]; // All players currently in the game
  foods: Food[];     // All food items in the world
}

/**
 * ------------------
 * FRONTEND TYPES
 * ------------------
 */

/**
 * Socket context for React components
 * @see frontend/src/components/socket-provider.tsx
 */
interface SocketContextType {
  socket: any | null;      // Socket.IO connection (actual type is Socket from socket.io-client)
  isConnected: boolean;    // Connection status
  sendInput: (inputData: PlayerInput) => void; // Send input to server
  gameState: GameState | null;   // Latest game state from server
}

/**
 * Leaderboard entry for UI
 * @see frontend/app/page.tsx
 */
interface LeaderboardEntry {
  id: string;         // Player ID
  size: number;       // Player size
  score: number;      // Player score
  isLocalPlayer: boolean; // Whether this entry is the local player
}

/**
 * Props for the GameCanvas component
 * @see frontend/src/components/game-canvas.tsx
 */
interface GameCanvasProps {
  width: number;      // Canvas width
  height: number;     // Canvas height  
  className?: string; // Optional CSS class
}

/**
 * ------------------
 * SOCKET EVENTS
 * ------------------
 */

/**
 * Socket.IO Event Map
 * Documents the events used in the application
 */
interface ServerToClientEvents {
  gameUpdate: (state: GameState) => void;  // Server sends game state
  player_count: (count: number) => void;   // Server sends player count
}

interface ClientToServerEvents {
  input: (data: PlayerInput) => void;      // Client sends input
}

/**
 * This type definition file provides a comprehensive overview of the type system
 * used throughout the application. It's designed to help AI assistants understand
 * the data structures and their relationships.
 */ 