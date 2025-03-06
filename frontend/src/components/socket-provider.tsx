"use client";

/**
 * Socket Provider Component
 * 
 * This module provides real-time WebSocket connectivity between the frontend and backend,
 * managing connection state, data transmission, and game state synchronization.
 * 
 * The component uses React Context to make socket functionality available throughout
 * the application without prop drilling.
 * 
 * @module socket-provider
 */

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode, 
  useRef,
  useCallback 
} from 'react';
import { Socket, io } from 'socket.io-client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Socket context type definition
 * Provides the interface for components to access socket functionality
 */
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendInput: (inputData: PlayerInput) => void;
  gameState: GameState | null;
}

/**
 * Player input data interface
 * Represents mouse movement data sent to the server
 */
export interface PlayerInput {
  x: number;      // X position on the map
  y: number;      // Y position on the map
}

/**
 * Shrimp (player) interface
 * Represents a player in the game world
 */
export interface Shrimp {
  id: string;     // Unique player identifier
  x: number;      // X position on the map
  y: number;      // Y position on the map
  size: number;   // Size of the shrimp (grows as it eats)
  score: number;  // Player's score
}

/**
 * Food item interface
 * Represents food that players can eat to grow
 */
export interface Food {
  x: number;      // X position on the map
  y: number;      // Y position on the map
  size: number;   // Size of the food item
}

/**
 * Complete game state interface
 * Represents the entire game world state
 */
export interface GameState {
  shrimps: Shrimp[];
  foods: Food[];
}

// Score constants for detecting events
const SCORE_PER_FOOD = 5;
const SCORE_PER_SHRIMP = 20;

// =============================================================================
// CONTEXT CREATION
// =============================================================================

/**
 * Socket context with default values
 * Used to provide socket functionality throughout the application
 */
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  sendInput: () => {}, // Default no-op function
  gameState: null,
});

/**
 * Custom hook to use socket functionality in components
 * @returns Socket context containing connection state and methods
 */
export const useSocket = () => useContext(SocketContext);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

/**
 * Props for the socket provider component
 */
interface SocketProviderProps {
  children: ReactNode;
}

/**
 * Socket provider component to manage WebSocket connection
 * This component handles:
 * 1. Establishing and maintaining WebSocket connection
 * 2. Managing connection state
 * 3. Sending player input to server
 * 4. Receiving and processing game state updates
 * 
 * @param {SocketProviderProps} props - Component props
 * @returns React component that provides socket context
 */
export const SocketProvider = ({ children }: SocketProviderProps) => {
  // State management
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // Reference values for tracking changes between updates
  const prevShrimpsRef = useRef<Map<string, Shrimp>>(new Map());
  const lastUpdateTimeRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 5;

  /**
   * Send player input to the server
   * This function is used by the game canvas to transmit mouse movement
   * 
   * @param {PlayerInput} inputData - X/Y coordinates from mouse movement
   */
  const sendInput = useCallback((inputData: PlayerInput) => {
    if (socket && isConnected) {
      // Send 'input' event with mouse coordinates
      socket.emit('input', inputData);
    }
  }, [socket, isConnected]);

  // =============================================================================
  // CONNECTION MANAGEMENT
  // =============================================================================

  /**
   * Socket connection setup and event handlers
   * Handles establishing connection, reconnection, and cleanup
   */
  useEffect(() => {
    // Get the backend URL from environment variable or use default
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    console.log(`Connecting to backend at: ${backendUrl}`);
    
    // Create socket connection with retry logic
    const socketInstance = io(backendUrl, {
      reconnectionAttempts: MAX_RETRIES,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Set the socket instance
    setSocket(socketInstance);

    /**
     * Handle successful connection
     * Updates connection state and resets retry counter
     */
    const onConnect = () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
      retryCountRef.current = 0; // Reset retry count on successful connection
    };

    /**
     * Handle disconnection
     * Updates connection state and logs reason for disconnection
     * 
     * @param {string} reason - Reason for disconnection
     */
    const onDisconnect = (reason: string) => {
      console.log(`Disconnected from Socket.IO server: ${reason}`);
      setIsConnected(false);
      
      // Log additional information for debugging
      if (reason === 'io server disconnect') {
        console.log('The server has forcefully disconnected the connection');
      } else if (reason === 'transport close') {
        console.log('The connection was closed (transport error)');
      }
    };

    /**
     * Handle connection errors
     * Updates connection state, logs error, and tracks retry attempts
     * 
     * @param {Error} error - Connection error
     */
    const onError = (error: Error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      
      retryCountRef.current++;
      console.log(`Connection retry attempt: ${retryCountRef.current}/${MAX_RETRIES}`);
      
      if (retryCountRef.current >= MAX_RETRIES) {
        console.error('Max connection retries reached. Please check your connection.');
      }
    };

    // =============================================================================
    // GAME STATE HANDLING
    // =============================================================================

    /**
     * Handle game state updates from server
     * Processes and validates incoming game state, updates local state,
     * and detects game events (eating, collisions)
     * 
     * @param {GameState} updatedState - New game state from server
     */
    const onGameUpdate = (updatedState: GameState) => {
      if (!updatedState) {
        console.error('Received empty game state');
        return;
      }
      
      // Log update time for debugging
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;
      
      // Log less frequently in production
      if (process.env.NODE_ENV === 'development' || Math.random() < 0.1) {
        console.log(`Game state updated after ${timeSinceLastUpdate}ms`);
      }
      
      // Validate the structure of the game state
      if (!Array.isArray(updatedState.shrimps) || !Array.isArray(updatedState.foods)) {
        console.error('Invalid game state structure:', updatedState);
        return;
      }
      
      // Only log detailed state in development or occasionally in production
      if (process.env.NODE_ENV === 'development' || Math.random() < 0.1) {
        console.log(`Received game state with ${updatedState.shrimps.length} shrimps and ${updatedState.foods.length} foods`);
      }
      
      // Check if there's a player shrimp for the current socket
      if (socketInstance && updatedState.shrimps.length > 0) {
        const playerShrimp = updatedState.shrimps.find(shrimp => shrimp.id === socketInstance.id);
        if (playerShrimp) {
          // Only log in development or occasionally in production
          if (process.env.NODE_ENV === 'development' || Math.random() < 0.05) {
            console.log(`My shrimp: position (${playerShrimp.x}, ${playerShrimp.y}), size: ${playerShrimp.size}, score: ${playerShrimp.score}`);
          }
        } else {
          console.warn(`No shrimp found for player with ID: ${socketInstance.id}`);
        }
      }
      
      // Create a map of current shrimps for easy lookup
      const currentShrimps = new Map<string, Shrimp>();
      updatedState.shrimps.forEach(shrimp => {
        currentShrimps.set(shrimp.id, shrimp);
      });
      
      // Check for shrimps that were present before but are now gone (eaten or disconnected)
      if (prevShrimpsRef.current.size > 0) {
        const eatenShrimps: string[] = [];
        
        prevShrimpsRef.current.forEach((prevShrimp, id) => {
          if (!currentShrimps.has(id)) {
            eatenShrimps.push(id);
          }
        });
        
        // Log any shrimps that were eaten (excluding the socket's own shrimp to avoid duplicate logging)
        if (eatenShrimps.length > 0) {
          eatenShrimps.forEach(id => {
            // Check if it's not the local player (already logged by server)
            if (socketInstance && socketInstance.id !== id) {
              console.log(`Shrimp ${id.substring(0, 6)}... was removed from the game`);
            }
          });
        }
      }
      
      // Track score changes to identify when players eat others
      currentShrimps.forEach((currentShrimp, id) => {
        const prevShrimp = prevShrimpsRef.current.get(id);
        if (prevShrimp && currentShrimp.score > prevShrimp.score) {
          const scoreDiff = currentShrimp.score - prevShrimp.score;
          
          // If score increased by SCORE_PER_SHRIMP or more, a shrimp was eaten
          if (scoreDiff >= SCORE_PER_SHRIMP) {
            console.log(`Shrimp ${id.substring(0, 6)}... ate another shrimp! Score: ${currentShrimp.score}`);
          }
        }
      });
      
      // Update previous shrimps reference
      prevShrimpsRef.current = currentShrimps;
      
      // Update the game state
      setGameState(updatedState);
    };

    // =============================================================================
    // EVENT REGISTRATION
    // =============================================================================

    // Register event handlers
    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onError);
    socketInstance.on('gameUpdate', onGameUpdate);
    
    // Log other events only in development
    if (process.env.NODE_ENV === 'development') {
      socketInstance.onAny((eventName, ...args) => {
        console.log(`Socket event: ${eventName}`, args);
      });
    }

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onError);
      socketInstance.off('gameUpdate', onGameUpdate);
      
      if (process.env.NODE_ENV === 'development') {
        socketInstance.offAny();
      }
      
      socketInstance.disconnect();
    };
  }, []);

  // =============================================================================
  // CONTEXT PROVIDER RENDER
  // =============================================================================

  return (
    <SocketContext.Provider value={{ socket, isConnected, sendInput, gameState }}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Extended Socket interface for game-specific methods
 * This is a placeholder for any game-specific socket extensions
 */
export interface GameSocket extends Socket {
  // Add game-specific socket methods and properties here as needed
} 