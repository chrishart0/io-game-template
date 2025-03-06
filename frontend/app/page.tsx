"use client"
import { useEffect, useState } from 'react';
import { SocketProvider, useSocket } from '@/src/components/socket-provider';
import { GameCanvas } from '@/src/components/game-canvas';
import './game-styles.css';

// Interface for leaderboard entry
interface LeaderboardEntry {
  id: string;
  size: number;
  score: number;
  isLocalPlayer: boolean;
}

// Main game component
function Game() {
  const { isConnected, socket, gameState } = useSocket();
  const [playerCount, setPlayerCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

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

  // Update leaderboard whenever game state changes
  useEffect(() => {
    if (!gameState || !socket) return;
    
    // Create leaderboard entries from shrimps
    const entries: LeaderboardEntry[] = gameState.shrimps.map(shrimp => ({
      id: shrimp.id,
      size: shrimp.size,
      score: shrimp.score,
      isLocalPlayer: shrimp.id === socket.id
    }));
    
    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);
    
    // Update leaderboard state
    setLeaderboard(entries);
  }, [gameState, socket]);

  // We're no longer displaying the score
  // but keeping the function for future reference
  const getPlayerSize = () => {
    if (!gameState || !socket) return 0;
    
    const playerShrimp = gameState.shrimps.find(shrimp => shrimp.id === socket.id);
    if (playerShrimp) {
      return playerShrimp.size;
    }
    return 0;
  };

  // Get player rank from leaderboard
  const getPlayerRank = (): number => {
    const playerIndex = leaderboard.findIndex(entry => entry.isLocalPlayer);
    return playerIndex !== -1 ? playerIndex + 1 : 0;
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
        
        {/* Game container and leaderboard layout */}
        <div className="w-full flex gap-4">
          {/* Game container */}
          <div className="relative flex-grow game-container game-glow">
            <div className="bg-black/25 rounded-lg p-1.5 backdrop-blur-sm border border-white/10 shadow-xl">
              {/* Game canvas - using the GameCanvas component instead of inline canvas */}
              <GameCanvas 
                width={800} 
                height={600} 
                className="w-full h-full rounded bg-black/50"
              />
              
              {/* Controls hint */}
              <div className="absolute top-4 right-4 bg-black/50 px-3 py-1.5 rounded-md text-xs backdrop-blur-sm border border-white/10 text-muted-foreground">
                Move your mouse to control
              </div>
            </div>
          </div>
          
          {/* Leaderboard panel */}
          <div className="w-64 bg-black/25 rounded-lg p-4 backdrop-blur-sm border border-white/10 shadow-xl">
            <h2 className="text-lg font-semibold mb-3 text-center text-glow">Leaderboard</h2>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className={`flex justify-between items-center py-1 px-2 rounded ${
                      entry.isLocalPlayer 
                        ? 'bg-blue-900/50 border border-blue-700/50' 
                        : 'bg-black/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400">#{index + 1}</span>
                      <span className={`${entry.isLocalPlayer ? 'text-yellow-300 font-semibold' : 'text-white'}`}>
                        {entry.isLocalPlayer ? 'YOU' : `Player ${entry.id.substring(0, 4)}`}
                      </span>
                    </div>
                    <span className="text-green-400 font-medium">{entry.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 text-sm">Waiting for players...</div>
            )}
            
            {/* Your rank indicator */}
            {getPlayerRank() > 0 && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="text-center text-sm">
                  <span className="text-gray-400">Your Rank: </span>
                  <span className="text-yellow-300 font-semibold">#{getPlayerRank()}</span>
                  {getPlayerRank() === 1 && (
                    <span className="ml-2 text-yellow-300">👑</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Game instructions */}
        <div className="w-full max-w-2xl mt-6 px-6 py-4 bg-black/25 rounded-lg backdrop-blur-sm border border-white/10">
          <h2 className="text-lg font-semibold mb-2 text-glow">How to Play</h2>
          <p className="text-sm text-muted-foreground">
            Control your shrimp by moving your mouse. The shrimp will follow your cursor position.
            Eat the green food dots to grow larger and earn points. Larger shrimps can eat smaller ones!
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
