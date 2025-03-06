"use client"
import { useEffect, useRef, useState } from 'react';
import { SocketProvider, useSocket } from '@/src/components/socket-provider';
import './game-styles.css';

// Main game component
function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, socket } = useSocket();
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    // Canvas and game initialization code can go here
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up the canvas with a dark background
    ctx.fillStyle = '#0f172a'; // Dark blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw a grid pattern for the game world
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    
    // Draw grid lines
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw a player shape (simple circle with glow effect)
    const centerX = canvas.width / 2 - 200;
    const centerY = canvas.height / 2 - 100;
    const radius = 30;

    // Create gradient for glow effect
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.5,
      centerX, centerY, radius * 1.5
    );
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
    
    // Draw glow
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw a simple rectangle to represent food or another player
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(centerX + 200, centerY, 20, 20);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen game-bg p-6">
      <div className="w-full max-w-5xl flex flex-col items-center gap-6">
        <header className="w-full flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 game-title text-glow">
            IO Game Arena
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
              Players online: {playerCount}
            </div>
            <div className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
              isConnected 
                ? 'bg-green-950/60 text-green-400 border border-green-800/50' 
                : 'bg-red-950/60 text-red-400 border border-red-800/50'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </header>
        
        {/* Game container */}
        <div className="relative w-full game-container game-glow">
          <div className="bg-black/25 rounded-lg p-1.5 backdrop-blur-sm border border-white/10 shadow-xl">
            {/* Game canvas */}
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={600} 
              className="w-full h-full rounded bg-black/50"
            />
            
            {/* Game overlay UI elements */}
            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1.5 rounded-md text-sm backdrop-blur-sm border border-white/10">
              Score: 0
            </div>
            
            {/* Controls hint */}
            <div className="absolute top-4 right-4 bg-black/50 px-3 py-1.5 rounded-md text-xs backdrop-blur-sm border border-white/10 text-muted-foreground">
              Use WASD or arrow keys to move
            </div>
          </div>
        </div>
        
        {/* Game instructions */}
        <div className="w-full max-w-2xl mt-6 px-6 py-4 bg-black/25 rounded-lg backdrop-blur-sm border border-white/10">
          <h2 className="text-lg font-semibold mb-2 text-glow">How to Play</h2>
          <p className="text-sm text-muted-foreground">
            Control your player and collect resources. Avoid larger enemies and try to grow bigger!
          </p>
        </div>
      </div>
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
