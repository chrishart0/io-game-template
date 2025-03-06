# AI Assistant Guide for IO Game Project

This guide is designed to help AI assistants like Claude understand and navigate this codebase effectively. It outlines the project structure, key patterns, and important implementation details of this multiplayer .io-style game.

## Project Architecture

### Directory Structure
```
my-io-game/
├── frontend/                 # Next.js frontend (App Router)
│   ├── app/                  # Next.js pages and layouts
│   │   ├── page.tsx          # Main game page with leaderboard
│   │   └── game-styles.css   # Game-specific styles
│   └── src/                  # Frontend source code
│       └── components/       # React components
│           ├── socket-provider.tsx  # WebSocket connection management
│           └── game-canvas.tsx      # Game rendering and animation
├── backend/                  # Node.js backend
│   └── src/                  # Backend source code
│       ├── server.ts         # Express and Socket.IO server
│       └── game-state.ts     # Game logic and state management
└── package.json              # Root package.json with scripts
```

## Key Type Definitions

### Backend Types
- `ServerConfig`: Configuration parameters for the server in `server.ts`
- `PlayerInput`: Input data structure from clients in `server.ts`
- `GameConfig`: Game mechanics configuration in `game-state.ts`
- `Shrimp`: Player entity representing a shrimp in `game-state.ts`
- `Food`: Food entity that shrimps can eat in `game-state.ts`
- `GameState`: Complete game state structure in `game-state.ts`

### Frontend Types
- `SocketContextType`: Socket.IO connection context in `socket-provider.tsx`
- `PlayerInput`: Input data to send to server in `socket-provider.tsx`
- `Shrimp`, `Food`, `GameState`: Mirror entities from backend in `socket-provider.tsx`
- `LeaderboardEntry`: Derived player data for UI in `page.tsx`

## Communication Flow

1. **Connection**: Browser connects to Socket.IO server via `socket-provider.tsx`
2. **Input Handling**:
   - User moves mouse in `game-canvas.tsx`
   - Position sent via `sendInput()` to server
   - Server updates player position in `updateShrimpPosition()`
3. **Game Loop**:
   - Server processes game mechanics in `processEating()`
   - Updated state broadcast to all clients
   - Clients render new state in `game-canvas.tsx`

## Core Implementation Patterns

### State Management
- Backend maintains authoritative state in `game-state.ts`
- Functions mutate state and broadcast changes
- Frontend mirrors state and handles rendering only

### Real-time Updates
- Server emits `gameUpdate` events on fixed interval
- Client receives state and updates React state
- Canvas rendering happens on animation frame

### Performance Optimization
- Frontend uses memoization for UI components
- Canvas uses caching for asset rendering
- Backend uses efficient data structures (Map)

## Key Functions

### Backend
- `initGameState()`: Initialize game world
- `processEating()`: Core game mechanics
- `addShrimp()`: Add new player
- `updateShrimpPosition()`: Update player position

### Frontend
- `SocketProvider`: Context provider for Socket.IO
- `sendInput()`: Send player input to server
- `GameCanvas`: Render game world
- `useSocket()`: Custom hook to access socket

## Tips for AI Development

When modifying this codebase:

1. **Game Logic**: Backend game mechanics are in `game-state.ts`
2. **Network Code**: Socket event handling in `server.ts` and `socket-provider.tsx`
3. **UI Components**: User interface elements in `page.tsx`
4. **Rendering**: Canvas rendering in `game-canvas.tsx`

When adding features:
- Add entity types to both frontend and backend
- Update game state to include new entities
- Add processing logic to the game loop
- Update rendering in game-canvas

## Common Socket Events

- `connection`: New player connects
- `disconnect`: Player disconnects
- `input`: Player sends input data
- `gameUpdate`: Server broadcasts state
- `player_count`: Server broadcasts player count

This guide is designed to help AI assistants navigate and understand the codebase quickly. Refer to specific files for detailed implementation. 