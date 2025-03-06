"use client"
import { useEffect, useRef } from 'react';
import { SocketProvider, useSocket } from '@/src/components/socket-provider';

// Main game component
function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, socket } = useSocket();

  useEffect(() => {
    // Canvas and game initialization code can go here
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a simple rectangle to show the canvas is working
    ctx.fillStyle = '#3498db';
    ctx.fillRect(10, 10, 100, 100);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <h1 className="text-3xl font-bold">My .io Game</h1>
      
      {/* Display connection status */}
      <div className={`px-4 py-2 rounded-md ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        Status: {isConnected ? 'Connected to server' : 'Disconnected from server'}
      </div>
      
      {/* Game canvas */}
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="border border-gray-300 rounded-md"
      />
    </div>
  );
}

// Wrap the Game component with SocketProvider
export default function Home() {
  return (
    <SocketProvider>
      <Game />
    </SocketProvider>
  );
}
