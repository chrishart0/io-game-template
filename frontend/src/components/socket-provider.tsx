"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket, io } from 'socket.io-client';

// Define the socket context interface
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

// Create the context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

// Hook to use socket in components
export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get the backend URL from environment variable or use default
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    
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

    // Register event handlers
    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onError);

    // Cleanup on unmount
    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onError);
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// Export interface for the socket
export interface GameSocket extends Socket {
  // Add game-specific socket methods and properties here as needed
} 