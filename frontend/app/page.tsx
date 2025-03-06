"use client"
import { useEffect, useState } from 'react';
import { SocketProvider, useSocket } from '@/src/components/socket-provider';
import { GameCanvas } from '@/src/components/game-canvas';
import './game-styles.css';

// Main game component
function Game() {
  const { isConnected, socket, gameState } = useSocket();
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // Listen for player count updates
    socket.on('player_count', (count: number) => {
      setPlayerCount(count);
    });

    return () => {
      socket.off('player_count');
    };
  }, [socket]);

  // Calculate player score
  const getPlayerScore = () => {
    if (!gameState || !socket) return 0;
    
    const playerShrimp = gameState.shrimps.find(shrimp => shrimp.id === socket.id);
    if (playerShrimp) {
      return playerShrimp.size - 10; // Score = size - initial size
    }
    return 0;
  };

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
            {/* Game canvas - using the GameCanvas component instead of inline canvas */}
            <GameCanvas 
              width={800} 
              height={600} 
              className="w-full h-full rounded bg-black/50"
            />
            
            {/* Game overlay UI elements */}
            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1.5 rounded-md text-sm backdrop-blur-sm border border-white/10">
              Score: {getPlayerScore()}
            </div>
            
            {/* Controls hint */}
            <div className="absolute top-4 right-4 bg-black/50 px-3 py-1.5 rounded-md text-xs backdrop-blur-sm border border-white/10 text-muted-foreground">
              Move your mouse to control
            </div>
          </div>
        </div>
        
        {/* Game instructions */}
        <div className="w-full max-w-2xl mt-6 px-6 py-4 bg-black/25 rounded-lg backdrop-blur-sm border border-white/10">
          <h2 className="text-lg font-semibold mb-2 text-glow">How to Play</h2>
          <p className="text-sm text-muted-foreground">
            Control your shrimp by moving your mouse. The shrimp will follow your cursor position.
            Eat the green food dots to grow larger. Your score increases as you grow!
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
