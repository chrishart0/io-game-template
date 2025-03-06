# Shrimp.io Game

A real-time multiplayer .io-style game built with Next.js, React, Node.js, Express and Socket.IO. Players control shrimp characters that grow by consuming food and other players.

![Shrimp.io Game](https://via.placeholder.com/800x400?text=Shrimp.io+Game+Screenshot)

## Project Overview

**Shrimp.io** is a fun, fast-paced multiplayer game with:
- **Real-time WebSocket Communication**: Instant movement synchronization among all players
- **Canvas-based Rendering**: Smooth animation and efficient graphics
- **Performance Optimizations**: Adaptive rendering based on device capabilities
- **Visual Effects**: Engaging animations and feedback for game events
- **AI-Assisted Development**: Optimized for Cursor powered by Claude 3 Sonnet

### Features

- 🎮 Move your shrimp with the mouse
- 🍔 Consume food particles to grow larger
- 🦐 Eat smaller shrimps to gain their size
- 📊 Compete on the live leaderboard
- ⚙️ Toggle performance mode for smoother gameplay

## Tech Stack

- **Frontend**: Next.js (App Router) with TypeScript, React, and `socket.io-client`
- **Backend**: Node.js with Express.js, TypeScript, and Socket.IO
- **Development**: AI-assisted coding with Cursor powered by Claude

## Repository Structure

```
my-io-game/
├── frontend/                 # Next.js frontend
│   ├── app/                  # Next.js App Router pages
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
├── AI-GUIDE.md               # Guide for AI assistants
├── AI-CODE-PATTERNS.md       # Common code patterns for AI reference
├── CURSOR-READY.md           # Summary of AI-optimized improvements
└── types.d.ts                # Centralized type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/my-io-game.git
cd my-io-game
```

2. Install dependencies:
```bash
npm run install:all
```

### Running the Development Server

Start both frontend and backend:
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### Configuration

- **Frontend**: Set `NEXT_PUBLIC_BACKEND_URL` in `.env.local` (default: http://localhost:4000)
- **Backend**: Set `PORT` in `.env` (default: 4000)

## AI-Assisted Development

This project is optimized for AI-assisted development with Cursor powered by Claude. Special features include:

- **AI Documentation**: Dedicated files like `AI-GUIDE.md` and `AI-CODE-PATTERNS.md` to help AI assistants understand the codebase
- **Type Centralization**: Core types aggregated in `types.d.ts` for easy reference
- **Code Organization**: Clear section markers and comprehensive JSDoc comments
- **Pattern Consistency**: Standardized React patterns, state management, and Socket.IO communication

For detailed information on AI-optimized improvements, see [CURSOR-READY.md](./CURSOR-READY.md).

## Development Workflow

### Adding New Features

1. Define interfaces in both frontend (`socket-provider.tsx`) and backend (`game-state.ts`)
2. Add server-side logic in the appropriate backend file
3. Implement client-side rendering in `game-canvas.tsx`
4. Add UI components in `page.tsx` if needed

### Project Status

This project has completed most key milestones:

✅ Project Setup  
✅ WebSocket Connection  
✅ Player Input Handling  
✅ Game State Management  
✅ Rendering and Animations  
✅ Performance Optimization  
⬜ Deployment  

## Contributing

See [AI-CODE-PATTERNS.md](./AI-CODE-PATTERNS.md) for guidance on common code patterns used in this project.

## Game Mechanics

- Shrimps move toward the cursor position
- Each food item increases your size and score
- Larger shrimps can eat smaller ones
- The larger you grow, the slower you move
- Performance mode activates automatically when FPS drops below 40

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by classic .io games like Agar.io and Slither.io