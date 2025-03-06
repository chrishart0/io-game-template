"use client";

import { useEffect, useRef } from 'react';
import { useSocket, PlayerInput } from './socket-provider';

interface GameCanvasProps {
  width: number;
  height: number;
  className?: string;
}

export function GameCanvas({ width, height, className = '' }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, sendInput } = useSocket();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up the canvas with a dark background
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
  }, []);

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