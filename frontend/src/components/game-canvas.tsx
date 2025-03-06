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
  // Add state for preloaded images
  const [images, setImages] = useState<{[key: string]: HTMLImageElement}>({});
  // Add ref for cached canvas renders of the images
  const cachedCanvasesRef = useRef<{[key: string]: HTMLCanvasElement}>({});
  // Add state for performance mode
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);
  // Add state for manual mode control
  const [isAutoPerformance, setIsAutoPerformance] = useState(true);
  // Add state for debug mode
  const [isDebugMode, setIsDebugMode] = useState(false);
  // Track FPS for performance monitoring
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now(), fps: 60 });
  // Ref to store previous game state for change detection
  const prevGameStateRef = useRef<any>(null);
  // Flag to force redraw when needed
  const needsRedrawRef = useRef<boolean>(true);
  // Track last render time for transition smoothing
  const lastRenderTimeRef = useRef<number>(performance.now());
  // Store animation frame ID for cleanup
  const animationFrameIdRef = useRef<number | null>(null);
  
  // SIMPLIFIED FOOD ANIMATION - Just track eaten events with timestamps
  const [eatAnimation, setEatAnimation] = useState<{active: boolean, time: number, x: number, y: number}>({
    active: false,
    time: 0,
    x: 0,
    y: 0
  });
  
  // Track food count to detect when food is eaten
  const prevFoodCountRef = useRef<number>(0);

  // Detect food eaten events in a very simple way
  useEffect(() => {
    if (!gameState || !socket) return;
    
    const currentFoodCount = gameState.foods.length;
    
    // If food count decreased, show eat animation
    if (prevFoodCountRef.current > 0 && currentFoodCount < prevFoodCountRef.current) {
      // Find player position
      const playerShrimp = gameState.shrimps.find(shrimp => shrimp.id === socket.id);
      if (playerShrimp) {
        console.log('Food eaten! Showing animation');
        
        // Activate animation at player position
        setEatAnimation({
          active: true,
          time: Date.now(),
          x: playerShrimp.x,
          y: playerShrimp.y
        });
      }
    }
    
    // Update previous count
    prevFoodCountRef.current = currentFoodCount;
  }, [gameState, socket]);

  // Extra useEffect to handle deactivation
  useEffect(() => {
    if (eatAnimation.active) {
      // Set a timer to turn off the animation after 1 second
      const timer = setTimeout(() => {
        setEatAnimation(prev => ({...prev, active: false}));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [eatAnimation.active]);

  // Preload all the game images when component mounts
  useEffect(() => {
    const imagesToLoad = [
      { name: 'shrimp', src: '/game-assets/shrimp.svg' },
      { name: 'shrimpBlue', src: '/game-assets/shrimp-blue.svg' },
      { name: 'shrimpGold', src: '/game-assets/shrimp-gold.svg' },
      { name: 'shrimpSimple', src: '/game-assets/shrimp-simple.svg' },
      { name: 'shrimpBlueSimple', src: '/game-assets/shrimp-blue-simple.svg' },
      { name: 'foodAlgae', src: '/game-assets/food-algae.svg' },
      { name: 'foodPlankton', src: '/game-assets/food-plankton.svg' },
      { name: 'foodBubble', src: '/game-assets/food-bubble.svg' },
      { name: 'foodSimple', src: '/game-assets/food-simple.svg' }
    ];
    
    const loadedImages: {[key: string]: HTMLImageElement} = {};
    let loadedCount = 0;
    
    imagesToLoad.forEach(img => {
      const image = new Image();
      image.src = img.src;
      image.onload = () => {
        loadedCount++;
        loadedImages[img.name] = image;
        
        // When all images are loaded, update state and create cached canvases
        if (loadedCount === imagesToLoad.length) {
          setImages(loadedImages);
          
          // Create cached canvas renders for each image to improve performance
          const cachedCanvases: {[key: string]: HTMLCanvasElement} = {};
          Object.entries(loadedImages).forEach(([name, img]) => {
            // Create sizes for different entities
            const sizes = name.startsWith('shrimp') 
              ? [20, 30, 40, 50, 60] // Common shrimp sizes
              : [10, 15, 20, 25];    // Common food sizes
              
            sizes.forEach(size => {
              const cacheKey = `${name}_${size}`;
              const cacheCanvas = document.createElement('canvas');
              const ctx = cacheCanvas.getContext('2d');
              
              if (ctx) {
                // Make the canvas size match the display size to avoid scaling during game render
                cacheCanvas.width = size;
                cacheCanvas.height = size;
                
                // Draw the image once to this cache
                ctx.drawImage(img, 0, 0, size, size);
                cachedCanvases[cacheKey] = cacheCanvas;
              }
            });
          });
          
          cachedCanvasesRef.current = cachedCanvases;
          
          // Force a redraw when images are loaded
          needsRedrawRef.current = true;
        }
      };
    });

    // Clean up function
    return () => {
      // Clear cached canvases
      cachedCanvasesRef.current = {};
    };
  }, []);

  // Update player size whenever game state changes and check if we need to redraw
  useEffect(() => {
    if (gameState && socket) {
      // Find the current player's shrimp
      const playerShrimp = gameState.shrimps.find(shrimp => shrimp.id === socket.id);
      if (playerShrimp) {
        setPlayerSize(playerShrimp.size);
      }
      
      // Compare with previous state to determine if redraw is needed
      if (prevGameStateRef.current) {
        // Check if any shrimp positions or sizes changed
        const prevShrimps = prevGameStateRef.current.shrimps || [];
        const currentShrimps = gameState.shrimps || [];
        
        if (prevShrimps.length !== currentShrimps.length) {
          needsRedrawRef.current = true;
        } else {
          // Check for changes in position or size
          for (let i = 0; i < currentShrimps.length; i++) {
            const current = currentShrimps[i];
            const prev = prevShrimps.find((s: any) => s.id === current.id);
            
            if (!prev || prev.x !== current.x || prev.y !== current.y || prev.size !== current.size) {
              needsRedrawRef.current = true;
              break;
            }
          }
        }
        
        // Check if food items changed
        const prevFoods = prevGameStateRef.current.foods || [];
        const currentFoods = gameState.foods || [];
        
        if (prevFoods.length !== currentFoods.length) {
          needsRedrawRef.current = true;
        }
      } else {
        // First state update, need to draw
        needsRedrawRef.current = true;
      }
      
      // Update previous state reference
      prevGameStateRef.current = gameState;
    }
  }, [gameState, socket]);

  // Debug function to log game state
  const logGameState = () => {
    if (gameState) {
      if (isDebugMode) {
        console.log(`Game state: ${gameState.shrimps.length} shrimps, ${gameState.foods.length} foods`);
        if (gameState.shrimps.length > 0) {
          console.log('First shrimp:', gameState.shrimps[0]);
        }
      }
    } else {
      if (isDebugMode) {
        console.log('Game state is null');
      }
    }
  };

  // Draw the game world and entities
  useEffect(() => {
    // Return early if canvas isn't ready or we're not connected
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    
    // Log game state initially to diagnose issues
    if (isDebugMode) {
      logGameState();
    }
    
    // Function to render the game
    const renderGame = () => {
      // Calculate delta time for smooth transitions
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastRenderTimeRef.current) / 1000; // in seconds
      lastRenderTimeRef.current = currentTime;
      
      // Measure FPS
      fpsCounterRef.current.frames++;
      if (currentTime - fpsCounterRef.current.lastTime >= 1000) {
        fpsCounterRef.current.fps = fpsCounterRef.current.frames;
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = currentTime;
        
        // Only auto-switch if automatic mode is enabled
        if (isAutoPerformance) {
          // Check if we should switch to performance mode
          // Switch to performance mode if FPS drops below 40 or there are too many entities
          const totalEntities = gameState ? gameState.foods.length + gameState.shrimps.length : 0;
          const shouldUsePerformanceMode = fpsCounterRef.current.fps < 40 || totalEntities > 30;
          
          if (shouldUsePerformanceMode !== isPerformanceMode) {
            setIsPerformanceMode(shouldUsePerformanceMode);
            if (isDebugMode) {
              console.log(`Performance mode ${shouldUsePerformanceMode ? 'enabled' : 'disabled'}, FPS: ${fpsCounterRef.current.fps}, Entities: ${totalEntities}`);
            }
          }
        }
        
        // Log game state once per second for debugging
        if (isDebugMode) {
          logGameState();
        }
      }
      
      // Only render if needed or every other frame if in performance mode
      if (!needsRedrawRef.current && isPerformanceMode && frameCount % 2 !== 0) {
        frameCount++;
        animationFrameIdRef.current = requestAnimationFrame(renderGame);
        return;
      }
      
      // Always force redraw for now to ensure rendering
      needsRedrawRef.current = true;
      
      // Reset the redraw flag
      needsRedrawRef.current = false;
      frameCount++;
      
      // Clear the canvas
      ctx.fillStyle = '#0f172a'; // Dark blue background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw a grid for visual reference in debug mode
      if (isDebugMode) {
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
      }
      
      // Render the game state only if we have it
      if (gameState && socket) {
        // Draw food items
        const foodImageName = isPerformanceMode ? 'foodSimple' : 'foodPlankton';
        
        gameState.foods.forEach(food => {
          // Debug the food position if in debug mode
          if (isDebugMode && Math.random() < 0.01) { // Only log 1% of the time to reduce spam
            console.log(`Drawing food at ${food.x},${food.y} with size ${food.size}`);
          }
          
          // In debug mode, always draw a simple circle for food
          if (isDebugMode) {
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(food.x, food.y, food.size, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Try to draw the image if available and not in debug mode or in both modes
          if ((!isDebugMode || (isDebugMode && Math.random() > 0.5)) && Object.keys(images).length > 0 && images[foodImageName]) {
            // Get the cached food image if available
            const closestSize = [5, 10, 15, 20, 25].reduce((prev, curr) => 
              Math.abs(curr - food.size) < Math.abs(prev - food.size) ? curr : prev, 10
            );
            const cacheKey = `${foodImageName}_${closestSize}`;
            
            if (cachedCanvasesRef.current[cacheKey]) {
              // Draw the cached canvas at the food position
              ctx.drawImage(
                cachedCanvasesRef.current[cacheKey],
                food.x - food.size,
                food.y - food.size,
                food.size * 2,
                food.size * 2
              );
            } else if (images[foodImageName]) {
              // Fallback to drawing the image directly
              ctx.drawImage(
                images[foodImageName],
                food.x - food.size,
                food.y - food.size,
                food.size * 2,
                food.size * 2
              );
            }
          }
        });
        
        // Draw player shrimps
        gameState.shrimps.forEach(shrimp => {
          const isLocalPlayer = shrimp.id === socket.id;
          
          // Debug the shrimp position if in debug mode
          if (isDebugMode && isLocalPlayer) {
            console.log(`Drawing shrimp at ${shrimp.x},${shrimp.y} with size ${shrimp.size}, local: ${isLocalPlayer}`);
          }
          
          // Scale shrimp sprite based on size with a multiplier of 2 (size * 2 pixels)
          const scaledSize = shrimp.size * 2;
          
          // In debug mode, always draw a simple circle for shrimp
          if (isDebugMode) {
            ctx.fillStyle = isLocalPlayer ? '#ff0000' : '#0000ff';
            ctx.beginPath();
            ctx.arc(shrimp.x, shrimp.y, shrimp.size, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Choose image based on whether it's local player or other player
          const shrimpImageName = isLocalPlayer
            ? isPerformanceMode ? 'shrimpSimple' : 'shrimp'
            : isPerformanceMode ? 'shrimpBlueSimple' : 'shrimpBlue';
          
          // Only attempt to draw the image if images are loaded and not in debug mode or in both modes
          if ((!isDebugMode || (isDebugMode && !isLocalPlayer)) && Object.keys(images).length > 0 && images[shrimpImageName]) {
            // Get the closest pre-cached size
            const closestSize = [20, 30, 40, 50, 60].reduce((prev, curr) => 
              Math.abs(curr - scaledSize) < Math.abs(prev - scaledSize) ? curr : prev, 30
            );
            
            const cacheKey = `${shrimpImageName}_${closestSize}`;
            
            // Save context for drawing
            ctx.save();
            
            // Draw the shrimp sprite
            if (cachedCanvasesRef.current[cacheKey]) {
              // Draw the cached canvas at the shrimp position
              ctx.drawImage(
                cachedCanvasesRef.current[cacheKey],
                shrimp.x - scaledSize / 2,
                shrimp.y - scaledSize / 2,
                scaledSize,
                scaledSize
              );
            } else if (images[shrimpImageName]) {
              // Fallback to drawing the image directly
              ctx.drawImage(
                images[shrimpImageName],
                shrimp.x - scaledSize / 2,
                shrimp.y - scaledSize / 2,
                scaledSize,
                scaledSize
              );
            }
            
            ctx.restore();
          }
          
          // Add player ID label
          ctx.fillStyle = 'white';
          ctx.font = isLocalPlayer ? 'bold 14px Arial' : '12px Arial';
          const displayId = isLocalPlayer ? 'YOU' : shrimp.id.substring(0, 6);
          const textWidth = ctx.measureText(displayId).width;
          
          // Center the text below the shrimp
          const textX = shrimp.x - textWidth / 2;
          const textY = shrimp.y + scaledSize / 2 + 20;
          
          // Draw text shadow for visibility
          ctx.fillStyle = 'black';
          ctx.fillText(displayId, textX + 1, textY + 1);
          
          // Draw the actual text
          ctx.fillStyle = isLocalPlayer ? '#ffff00' : 'white';
          ctx.fillText(displayId, textX, textY);
        });
      } else {
        // Draw a message if no game state is available
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for game state...', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'start'; // Reset alignment
      }
      
      // UNMISSABLE food eating animation
      if (eatAnimation.active) {
        if (isDebugMode) {
          console.log('Rendering eat animation');
        }
        
        // Calculate animation properties
        const age = Date.now() - eatAnimation.time;
        const lifespan = 1000; // 1 second
        const alpha = 1 - (age / lifespan);
        
        // Save context
        ctx.save();
        
        // OPTION 1: Draw expanding circles
        const maxRadius = 150; // HUGE size
        const currentRadius = maxRadius * (age / lifespan);
        
        // Outer red ring - THICKER
        ctx.strokeStyle = 'rgba(255, 0, 0, ' + alpha + ')';
        ctx.lineWidth = 12; // Thicker
        ctx.beginPath();
        ctx.arc(eatAnimation.x, eatAnimation.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Middle yellow ring
        ctx.strokeStyle = 'rgba(255, 255, 0, ' + alpha + ')';
        ctx.lineWidth = 8; // Thicker
        ctx.beginPath();
        ctx.arc(eatAnimation.x, eatAnimation.y, currentRadius * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner white ring
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha + ')';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(eatAnimation.x, eatAnimation.y, currentRadius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // OPTION 2: Draw a FULL SCREEN flash
        if (age < 200) { // First 200ms - flash the whole screen
          ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * (1 - age/200)})`; // Transparent red
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // OPTION 3: HUGE NOM text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center'; // Center the text
        ctx.fillText('NOM!', eatAnimation.x, eatAnimation.y - currentRadius * 0.5);
        
        // Restore context
        ctx.restore();
      }
      
      // Draw debug information if debug mode is on
      if (isDebugMode) {
        // Draw FPS counter
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`FPS: ${fpsCounterRef.current.fps}`, 10, 20);
        
        // Draw performance mode indicator
        ctx.fillStyle = isPerformanceMode ? 'orange' : 'green';
        ctx.fillText(`Performance Mode: ${isPerformanceMode ? 'ON' : 'OFF'}`, 10, 40);
        
        // Draw connected status
        ctx.fillStyle = isConnected ? 'green' : 'red';
        ctx.fillText(`Connected: ${isConnected ? 'YES' : 'NO'}`, 10, 60);
      }
      
      // Continue animation loop
      animationFrameIdRef.current = requestAnimationFrame(renderGame);
    };
    
    // Start the render loop
    animationFrameIdRef.current = requestAnimationFrame(renderGame);
    
    // Cleanup function to cancel animation frame
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isConnected, isPerformanceMode, isAutoPerformance, gameState, socket, images, isDebugMode]);

  // Handle mouse movement to send player input
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isConnected || !socket) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Send input to server
    sendInput({ x, y });
  };
  
  // Toggle performance mode manually
  const togglePerformanceMode = () => {
    setIsPerformanceMode(prev => !prev);
    // When manually toggled, disable auto mode
    setIsAutoPerformance(false);
  };
  
  // Toggle auto performance mode
  const toggleAutoMode = () => {
    setIsAutoPerformance(prev => !prev);
  };
  
  // Toggle debug mode
  const toggleDebugMode = () => {
    setIsDebugMode(prev => !prev);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        className={`cursor-crosshair border border-slate-600 rounded-lg shadow-lg ${className}`}
      />
      <div className="absolute bottom-4 left-4 space-y-2">
        <button
          onClick={togglePerformanceMode}
          className="px-2 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600"
        >
          {isPerformanceMode ? 'Disable' : 'Enable'} Performance Mode
        </button>
        <button
          onClick={toggleAutoMode}
          className={`block px-2 py-1 text-white text-xs rounded hover:bg-slate-600 ${
            isAutoPerformance ? 'bg-green-700' : 'bg-slate-700'
          }`}
        >
          Auto Performance: {isAutoPerformance ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={toggleDebugMode}
          className={`block px-2 py-1 text-white text-xs rounded hover:bg-slate-600 ${
            isDebugMode ? 'bg-blue-700' : 'bg-slate-700'
          }`}
        >
          Debug Mode: {isDebugMode ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
} 