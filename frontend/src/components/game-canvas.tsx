"use client";

import { useEffect, useRef, useState } from 'react';
import { useSocket, PlayerInput } from './socket-provider';

interface GameCanvasProps {
  width: number;
  height: number;
  className?: string;
}

export function GameCanvas({ width, height, className = '' }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, sendInput, gameState, socket } = useSocket();
  const [playerSize, setPlayerSize] = useState<number>(10); // Default size

  // Update player size whenever game state changes
  useEffect(() => {
    if (gameState && socket) {
      // Find the current player's shrimp
      const playerShrimp = gameState.shrimps.find(shrimp => shrimp.id === socket.id);
      if (playerShrimp) {
        setPlayerSize(playerShrimp.size);
      }
    }
  }, [gameState, socket]);

  // Draw the game world and entities
  useEffect(() => {
    // Return early if canvas isn't ready or we're not connected
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Function to render the game
    const renderGame = () => {
      // Clear the canvas
      ctx.fillStyle = '#0f172a'; // Dark blue background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines (basic game world)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      
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

      // Only render game entities if we have game state
      if (gameState) {
        // Draw food items
        ctx.fillStyle = '#10b981'; // Green for food
        gameState.foods.forEach(food => {
          ctx.beginPath();
          ctx.arc(food.x, food.y, food.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw shrimps
        gameState.shrimps.forEach(shrimp => {
          // Is this the current player's shrimp?
          const isPlayer = socket && shrimp.id === socket.id;
          
          // Use different colors for player vs others
          ctx.fillStyle = isPlayer ? '#f43f5e' : '#6366f1'; // Pink for player, purple for others
          
          // Draw shrimp body
          ctx.beginPath();
          ctx.arc(shrimp.x, shrimp.y, shrimp.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw small eyes to show direction
          ctx.fillStyle = '#ffffff'; // White eyes
          ctx.beginPath();
          ctx.arc(shrimp.x + shrimp.size * 0.3, shrimp.y - shrimp.size * 0.3, shrimp.size * 0.2, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw player ID above shrimp (optional, helps debugging)
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          
          // Show 'YOU' for the player's shrimp
          const displayText = isPlayer ? 'YOU' : shrimp.id.slice(0, 4);
          ctx.fillText(displayText, shrimp.x, shrimp.y - shrimp.size - 5);
        });
        
        // Draw score display (lower left corner)
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${playerSize - 10}`, 10, canvas.height - 10);
      }

      // Request next animation frame
      requestAnimationFrame(renderGame);
    };

    // Start the render loop
    const animationId = requestAnimationFrame(renderGame);

    // Clean up animation frame on unmount
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameState, socket]);

  // Function to handle mouse movement
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isConnected || !canvasRef.current) return;

    // Get canvas position on the page
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to the canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Send input to server via socket provider
    const inputData: PlayerInput = { x, y };
    sendInput(inputData);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      onMouseMove={handleMouseMove}
    />
  );
} 