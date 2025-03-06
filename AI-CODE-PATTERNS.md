# AI-Friendly Code Patterns for IO Game

This document provides common code patterns and examples specifically for AI assistants like Claude to help with modifying and extending this codebase. Each section includes clear explanations and snippets that demonstrate the project's patterns.

## Socket.IO Communication Patterns

### Sending Events from Server to Client

```typescript
// Broadcasting to all connected clients
io.emit('eventName', data);

// Broadcasting to a specific client
socket.emit('eventName', data);

// Broadcasting to all clients except the sender
socket.broadcast.emit('eventName', data);
```

### Handling Events on the Client

```typescript
// In socket-provider.tsx
useEffect(() => {
  // Setup event handler
  const onEventName = (data: DataType) => {
    // Process event data
    console.log('Received event:', data);
    // Update state
    setState(data);
  };

  // Register handler
  socketInstance.on('eventName', onEventName);

  // Cleanup
  return () => {
    socketInstance.off('eventName', onEventName);
  };
}, [dependencies]);
```

### Sending Events from Client to Server

```typescript
// In a component using the socket hook
const { socket, isConnected } = useSocket();

const sendDataToServer = useCallback((data) => {
  if (socket && isConnected) {
    socket.emit('eventName', data);
  }
}, [socket, isConnected]);
```

## Game State Management

### Adding a New Entity Type

1. Define the interface in both frontend and backend:

```typescript
// In backend/src/game-state.ts
export interface NewEntity {
  id: string;
  x: number;
  y: number;
  // Other properties
}

// In frontend/src/components/socket-provider.tsx
export interface NewEntity {
  id: string;
  x: number;
  y: number;
  // Other properties
}
```

2. Add to the GameState interface:

```typescript
// In both backend and frontend
export interface GameState {
  shrimps: Shrimp[];
  foods: Food[];
  newEntities: NewEntity[]; // New property
}
```

3. Create storage and management functions:

```typescript
// In backend/src/game-state.ts
const newEntities: NewEntity[] = [];

export function addNewEntity(data: Partial<NewEntity>): NewEntity {
  const newEntity: NewEntity = {
    id: generateId(),
    x: 0,
    y: 0,
    // Default values
    ...data // Override with provided data
  };
  
  newEntities.push(newEntity);
  return newEntity;
}

// Update getGameState to include new entities
export function getGameState(): GameState {
  return {
    shrimps: Array.from(shrimps.values()),
    foods: [...foods],
    newEntities: [...newEntities]
  };
}
```

### Processing Logic in Game Loop

Add processing for new game mechanics in `processEating` or create a new function:

```typescript
export function processNewMechanic(): void {
  // Example: Move entities in a pattern
  newEntities.forEach(entity => {
    // Update position
    entity.x += Math.sin(Date.now() / 1000) * 2;
    entity.y += Math.cos(Date.now() / 1000) * 2;
    
    // Ensure boundaries
    entity.x = Math.max(0, Math.min(CONFIG.mapWidth, entity.x));
    entity.y = Math.max(0, Math.min(CONFIG.mapHeight, entity.y));
    
    // Process collisions or other logic
    // ...
  });
}

// Then add to server game loop:
// In server.ts game loop:
setInterval(() => {
  processEating();
  processNewMechanic(); // Add new processing function
  // Rest of game loop...
}, FRAME_DELAY);
```

## Rendering New Elements

```typescript
// In game-canvas.tsx
// Add to rendering function
const renderNewEntities = useCallback((ctx: CanvasRenderingContext2D, gameState: GameState) => {
  if (!gameState || !gameState.newEntities) return;
  
  gameState.newEntities.forEach(entity => {
    // Save current context
    ctx.save();
    
    // Set drawing properties
    ctx.fillStyle = '#FF5722';
    
    // Draw the entity
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Restore context
    ctx.restore();
  });
}, []);

// Add to main render function
useEffect(() => {
  // ...existing code
  if (ctx && gameState) {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Render all elements
    renderFoods(ctx, gameState);
    renderShrimps(ctx, gameState);
    renderNewEntities(ctx, gameState); // Add new render function
  }
  // ...existing code
}, [gameState, renderFoods, renderShrimps, renderNewEntities]);
```

## Adding New Configuration

```typescript
// In backend/src/game-state.ts
// Extend GameConfig interface
interface GameConfig {
  // Existing properties
  newFeatureEnabled: boolean;
  newEntitySpeed: number;
  newEntitySpawnRate: number;
}

// Update CONFIG object
const CONFIG: GameConfig = {
  // Existing properties
  mapWidth: 800,
  mapHeight: 600,
  // New properties
  newFeatureEnabled: true,
  newEntitySpeed: 5,
  newEntitySpawnRate: 0.01
};
```

## Socket Context Extension Pattern

```typescript
// In socket-provider.tsx
// Extend SocketContextType
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendInput: (inputData: PlayerInput) => void;
  gameState: GameState | null;
  // Add new methods
  sendNewAction: (data: NewActionData) => void;
  newGameState: NewGameState | null;
}

// Implement in provider
export const SocketProvider = ({ children }: SocketProviderProps) => {
  // Existing state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // New state
  const [newGameState, setNewGameState] = useState<NewGameState | null>(null);
  
  // New methods
  const sendNewAction = useCallback((data: NewActionData) => {
    if (socket && isConnected) {
      socket.emit('newAction', data);
    }
  }, [socket, isConnected]);
  
  // In useEffect
  useEffect(() => {
    // Existing setup
    
    // New event handler
    const onNewGameState = (data: NewGameState) => {
      setNewGameState(data);
    };
    
    // Register handler
    socketInstance.on('newGameState', onNewGameState);
    
    // Cleanup
    return () => {
      // Existing cleanup
      socketInstance.off('newGameState', onNewGameState);
    };
  }, []);
  
  // Updated provider value
  return (
    <SocketContext.Provider value={{ 
      socket, isConnected, sendInput, gameState,
      // New values
      sendNewAction, newGameState
    }}>
      {children}
    </SocketContext.Provider>
  );
};
```

## Adding New UI Components

```tsx
// In page.tsx
function Game() {
  // Existing code
  
  // New state for feature
  const [showNewFeature, setShowNewFeature] = useState(false);
  
  // Toggle handler
  const toggleNewFeature = useCallback(() => {
    setShowNewFeature(prev => !prev);
  }, []);
  
  return (
    <div className="flex flex-col items-center min-h-screen game-bg p-6">
      {/* Existing UI */}
      
      {/* New feature toggle button */}
      <button
        onClick={toggleNewFeature}
        className="px-4 py-2 bg-blue-600 text-white rounded-md mt-4"
      >
        {showNewFeature ? 'Hide' : 'Show'} New Feature
      </button>
      
      {/* Conditional rendering */}
      {showNewFeature && (
        <div className="w-full max-w-5xl mt-4 p-4 bg-black/25 rounded-lg backdrop-blur-sm">
          <h2 className="text-lg font-semibold">New Feature</h2>
          <p className="text-sm text-muted-foreground">
            This is the new feature content.
          </p>
          {/* New feature specific UI */}
        </div>
      )}
    </div>
  );
}
```

## Memoization Pattern

```tsx
// In any component
import { useMemo, useCallback } from 'react';

function Component(props) {
  // Derive computed value from props/state
  const computedValue = useMemo(() => {
    // Expensive calculation
    return expensiveCalculation(props.data);
  }, [props.data]);
  
  // Memoize function to prevent unnecessary re-renders
  const handleEvent = useCallback((event) => {
    // Handle event
    console.log('Event handled:', event);
  }, [dependencies]);
  
  // Memoize component
  const MemoizedChildComponent = useMemo(() => {
    return (
      <ChildComponent 
        data={computedValue}
        onEvent={handleEvent}
      />
    );
  }, [computedValue, handleEvent]);
  
  return (
    <div>
      {MemoizedChildComponent}
    </div>
  );
}
```

These patterns should help AI assistants like Claude understand the common code patterns in this project and provide consistent, high-quality modifications and extensions. 