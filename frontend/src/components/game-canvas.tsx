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
  // Track FPS for performance monitoring
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now(), fps: 60 });
  
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
        }
      };
    });

    // Clean up function
    return () => {
      // Clear cached canvases
      cachedCanvasesRef.current = {};
    };
  }, []);

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

    let frameCount = 0;
    let lastFrameTime = performance.now();
    
    // Function to render the game
    const renderGame = () => {
      // Measure FPS
      const currentTime = performance.now();
      const elapsed = currentTime - lastFrameTime;
      
      // Update FPS counter
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
            console.log(`Performance mode ${shouldUsePerformanceMode ? 'enabled' : 'disabled'}, FPS: ${fpsCounterRef.current.fps}, Entities: ${totalEntities}`);
          }
        }
      }
      
      // Only render every other frame if in performance mode
      if (isPerformanceMode && frameCount % 2 !== 0) {
        frameCount++;
        requestAnimationFrame(renderGame);
        return;
      }
      
      frameCount++;
      lastFrameTime = currentTime;
      
      // Clear the canvas
      ctx.fillStyle = '#0f172a'; // Dark blue background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // UNMISSABLE food eating animation
      if (eatAnimation.active) {
        console.log('Rendering eat animation');
        
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
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 15;
        ctx.font = 'bold 48px Arial'; // BIGGER font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NOM!', eatAnimation.x, eatAnimation.y - 60);
        
        // OPTION 4: Extra visual elements
        // Draw sparkles
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const x = eatAnimation.x + Math.cos(angle) * currentRadius * 0.8;
          const y = eatAnimation.y + Math.sin(angle) * currentRadius * 0.8;
          
          // Star shape
          ctx.fillStyle = 'yellow';
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const starAngle = (j / 5) * Math.PI * 2;
            const length = (j % 2 === 0) ? 10 : 5;
            const pointX = x + Math.cos(starAngle) * length;
            const pointY = y + Math.sin(starAngle) * length;
            
            if (j === 0) ctx.moveTo(pointX, pointY);
            else ctx.lineTo(pointX, pointY);
          }
          ctx.closePath();
          ctx.fill();
        }
        
        // Clear shadow for rest of rendering
        ctx.shadowBlur = 0;
        
        // Restore context
        ctx.restore();
      }
      
      // Draw grid lines (basic game world) - simplified in performance mode
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      
      const gridSize = isPerformanceMode ? 80 : 40; // Larger grid in performance mode
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

      // Only render game entities if we have game state and images are loaded
      if (gameState && Object.keys(images).length > 0) {
        const cachedCanvases = cachedCanvasesRef.current;
        
        // Draw food items with variety - only if in viewport
        gameState.foods.forEach((food, index) => {
          // Skip rendering if out of viewport (with margin)
          if (food.x < -50 || food.x > canvas.width + 50 || 
              food.y < -50 || food.y > canvas.height + 50) {
            return;
          }
          
          // In performance mode, use the simple food for all types
          if (isPerformanceMode) {
            const cacheKey = `foodSimple_${Math.round(food.size * 2)}`;
            const cachedCanvas = cachedCanvases[cacheKey];
            
            if (cachedCanvas) {
              ctx.drawImage(cachedCanvas, food.x - food.size, food.y - food.size);
            } else {
              ctx.drawImage(
                images.foodSimple,
                food.x - food.size, 
                food.y - food.size,
                food.size * 2,
                food.size * 2
              );
            }
            return;
          }
          
          // Normal mode - use a deterministic approach to select food type
          // Instead of using the array index (which changes when food is eaten),
          // use the food's coordinates to determine its type consistently
          const foodTypes = ['foodAlgae', 'foodPlankton', 'foodBubble'];
          
          // Hash the food's position to get a consistent type
          // This ensures each food maintains its appearance regardless of array position
          const positionHash = Math.abs(Math.floor(food.x * 100) + Math.floor(food.y * 100));
          const foodType = foodTypes[positionHash % foodTypes.length];
          
          // Calculate the size based on food size
          const drawSize = Math.round(food.size * 2); // Round to nearest to better match cache
          const roundedSize = [10, 15, 20, 25].reduce((prev, curr) => 
            Math.abs(curr - drawSize) < Math.abs(prev - drawSize) ? curr : prev, 10);
          
          // Use cached canvas if available
          const cacheKey = `${foodType}_${roundedSize}`;
          const cachedCanvas = cachedCanvases[cacheKey];
          
          if (cachedCanvas) {
            // Draw the cached canvas
            ctx.drawImage(
              cachedCanvas, 
              food.x - roundedSize/2, 
              food.y - roundedSize/2
            );
          } else if (images[foodType]) {
            // Fallback to direct image rendering
            ctx.drawImage(
              images[foodType], 
              food.x - drawSize/2, 
              food.y - drawSize/2, 
              drawSize, 
              drawSize
            );
          }
        });

        // Draw shrimps - only if in viewport
        gameState.shrimps.forEach(shrimp => {
          // Skip rendering if out of viewport (with margin)
          if (shrimp.x < -50 || shrimp.x > canvas.width + 50 || 
              shrimp.y < -50 || shrimp.y > canvas.height + 50) {
            return;
          }
          
          // Is this the current player's shrimp?
          const isPlayer = socket && shrimp.id === socket.id;
          
          // Choose shrimp image based on mode and player
          let shrimpType;
          
          if (isPerformanceMode) {
            // In performance mode, use simple shrimp graphics
            shrimpType = isPlayer ? 'shrimpSimple' : 'shrimpBlueSimple';
          } else {
            // Normal mode with full graphics
            if (isPlayer) {
              shrimpType = 'shrimp';
            } else {
              // Use player ID to consistently determine if they get a gold shrimp
              // Use a better hash of the entire ID instead of just the first character
              const playerIdHash = shrimp.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              // 10% chance of gold shrimp
              shrimpType = playerIdHash % 10 === 0 ? 'shrimpGold' : 'shrimpBlue';
            }
          }
          
          // Calculate size based on shrimp size (scaled up)
          const drawSize = Math.round(shrimp.size * 4);
          // Round to nearest cached size
          const roundedSize = [20, 30, 40, 50, 60].reduce((prev, curr) => 
            Math.abs(curr - drawSize) < Math.abs(prev - drawSize) ? curr : prev, 40);
          
          // Use cached canvas if available
          const cacheKey = `${shrimpType}_${roundedSize}`;
          const cachedCanvas = cachedCanvases[cacheKey];
          
          // Save current context state
          ctx.save();
          
          // Move to the shrimp position
          ctx.translate(shrimp.x, shrimp.y);
          
          if (cachedCanvas) {
            // Draw the cached canvas, centered
            ctx.drawImage(
              cachedCanvas, 
              -roundedSize/2, 
              -roundedSize/2
            );
          } else if (images[shrimpType]) {
            // Fallback to direct image rendering
            ctx.drawImage(
              images[shrimpType], 
              -drawSize/2, 
              -drawSize/2, 
              drawSize, 
              drawSize
            );
          }
          
          // Draw player ID above shrimp - only in normal mode or for player
          if (!isPerformanceMode || isPlayer) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            
            // Show 'YOU' for the player's shrimp
            const displayText = isPlayer ? 'YOU' : shrimp.id.slice(0, 4);
            ctx.fillText(displayText, 0, -shrimp.size - 5);
          }
          
          // Restore context state
          ctx.restore();
        });
      }

      // Performance stats - show FPS in debug mode
      if (isPerformanceMode) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${fpsCounterRef.current.fps}`, 10, 20);
        ctx.fillText(`Mode: ${isAutoPerformance ? 'Auto' : 'Manual'}`, 10, 40);
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
  }, [gameState, socket, images, isPerformanceMode, isAutoPerformance]);

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

  // Function to toggle performance mode manually
  const togglePerformanceMode = () => {
    if (isAutoPerformance) {
      // Switching from auto to manual - keep current mode
      setIsAutoPerformance(false);
    } else {
      // Toggle performance mode
      setIsPerformanceMode(!isPerformanceMode);
    }
  };

  // Function to toggle auto/manual mode
  const toggleAutoMode = () => {
    setIsAutoPerformance(!isAutoPerformance);
    // If switching back to auto, immediately evaluate performance
    if (!isAutoPerformance) {
      const totalEntities = gameState ? gameState.foods.length + gameState.shrimps.length : 0;
      const shouldUsePerformanceMode = fpsCounterRef.current.fps < 40 || totalEntities > 30;
      setIsPerformanceMode(shouldUsePerformanceMode);
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={className}
        onMouseMove={handleMouseMove}
      />
      
      {/* Performance controls - Moved to bottom right to avoid overlap */}
      <div className="absolute bottom-2 right-2 flex flex-col gap-2">
        <button 
          onClick={togglePerformanceMode} 
          className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-xs"
        >
          {isPerformanceMode ? "High Quality" : "Performance Mode"}
        </button>
        
        <button 
          onClick={toggleAutoMode} 
          className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-xs"
        >
          {isAutoPerformance ? "Manual Control" : "Auto Adjust"}
        </button>
      </div>
    </div>
  );
} 