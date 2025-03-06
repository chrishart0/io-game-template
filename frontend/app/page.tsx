"use client"
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export default function Home() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Connect to the WebSocket server (update URL for production later)
    const socket = io('http://localhost:4000');

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>My .io Game</h1>
      <canvas ref={canvasRef} width={800} height={600} style={{ border: '1px solid black' }} />
    </div>
  );
}
