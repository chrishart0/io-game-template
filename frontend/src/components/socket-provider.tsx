"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { Socket, io } from 'socket.io-client';

// Define the socket context interface
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendInput: (inputData: PlayerInput) => void;
  gameState: GameState | null;
}

// Interface for player input data
export interface PlayerInput {
  x: number;
  y: number;
}

// Interface for Shrimp (player)
export interface Shrimp {
  id: string;
  x: number;
  y: number;
  size: number;
  score: number;  // Added score property
}

// Interface for Food item
export interface Food {
  x: number;
  y: number;
  size: number;
}

// Interface for the complete game state
export interface GameState {
  shrimps: Shrimp[];
  foods: Food[];
}

// Create the context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  sendInput: () => {}, // Default no-op function
  gameState: null,
});

// Hook to use socket in components
export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // Keep track of previously seen shrimps to detect collisions
  const prevShrimpsRef = useRef<Map<string, Shrimp>>(new Map());
  
  // Track when the last game state update was received
  const lastUpdateTimeRef = useRef<number>(0);

  // Function to send player input to the server
  const sendInput = (inputData: PlayerInput) => {
    if (socket && isConnected) {
      // Send 'input' event with mouse coordinates
      socket.emit('input', inputData);
    }
  };

  useEffect(() => {
    // Get the backend URL from environment variable or use default
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    console.log(`Connecting to backend at: ${backendUrl}`);
    
    // Create socket connection
    const socketInstance = io(backendUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Set the socket instance
    setSocket(socketInstance);

    // Connection event handlers
    const onConnect = () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    };

    const onError = (error: Error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    };

    // Game state update handler
    const onGameUpdate = (updatedState: GameState) => {
      if (!updatedState) {
        console.error('Received empty game state');
        return;
      }
      
      // Log update time for debugging
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;
      console.log(`Game state updated after ${timeSinceLastUpdate}ms`);
      
      // Validate the structure of the game state
      if (!Array.isArray(updatedState.shrimps) || !Array.isArray(updatedState.foods)) {
        console.error('Invalid game state structure:', updatedState);
        return;
      }
      
      console.log(`Received game state with ${updatedState.shrimps.length} shrimps and ${updatedState.foods.length} foods`);
      
      // Check if there's a player shrimp for the current socket
      if (socketInstance && updatedState.shrimps.length > 0) {
        const playerShrimp = updatedState.shrimps.find(shrimp => shrimp.id === socketInstance.id);
        if (playerShrimp) {
          console.log(`My shrimp: position (${playerShrimp.x}, ${playerShrimp.y}), size: ${playerShrimp.size}, score: ${playerShrimp.score}`);
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
            if (socketInstance.id !== id) {
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
          
          // If score increased by more than the food value, a shrimp was eaten
          if (scoreDiff >= 20) { // SCORE_PER_SHRIMP value from backend
            console.log(`Shrimp ${id.substring(0, 6)}... ate another shrimp! Score: ${currentShrimp.score}`);
          }
        }
      });
      
      // Update previous shrimps reference
      prevShrimpsRef.current = currentShrimps;
      
      // Update the game state
      setGameState(updatedState);
    };

    // Register event handlers
    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onError);
    socketInstance.on('gameUpdate', onGameUpdate);
    
    // Log any other events for debugging
    socketInstance.onAny((eventName, ...args) => {
      console.log(`Socket event: ${eventName}`, args);
    });

    // Cleanup on unmount
    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onError);
      socketInstance.off('gameUpdate', onGameUpdate);
      socketInstance.offAny();
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, sendInput, gameState }}>
      {children}
    </SocketContext.Provider>
  );
};

// Export interface for the socket
export interface GameSocket extends Socket {
  // Add game-specific socket methods and properties here as needed
} 