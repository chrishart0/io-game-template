# .io-Style Game Development Roadmap

This document provides a structured guide for building a massively multiplayer .io-style game (e.g., similar to Agar.io or Slither.io). The project uses **NextJS** for the frontend and **Node.js** with **Express.js** and **Socket.IO** for the backend, all within a single repository. The roadmap includes a todo list, an outcome-based milestone plan, and repository context to facilitate development and collaboration.

---

## Project Overview

The goal is to create a real-time, multiplayer game with the following features:
- **Real-time Communication**: Players' actions (e.g., movement) are sent to the server and broadcast to others instantly.
- **Scalability**: The system should handle multiple simultaneous players.
- **Simple Web UI**: A minimal interface using a canvas for game rendering.
- **Ease of Setup**: A straightforward tech stack for quick development.
- **Performance Optimization**: Adaptive performance settings based on device capabilities and game load.
- **Visual Effects**: Engaging visual feedback for game events like food consumption.

### Tech Stack
- **Frontend**: NextJS (React) with `socket.io-client` for WebSocket communication.
- **Backend**: Node.js with Express.js and Socket.IO for real-time, bidirectional communication.
- **Repository Structure**: Both frontend and backend are organized in a single repo for simplicity.

---

## Repository Context

The repository is structured to keep the frontend and backend in separate directories, with a root-level `package.json` to manage both.

### Directory Structure
```
my-io-game/
├── frontend/                 # NextJS frontend
│   ├── package.json          # Frontend dependencies (NextJS, socket.io-client)
│   ├── app/                  # NextJS app directory (App Router)
│   │   ├── page.tsx          # Main game page with canvas element
│   │   ├── layout.tsx        # Root layout component
│   │   └── globals.css       # Global styles
│   ├── src/                  # Source code directory
│   │   └── components/       # React components
│   │       ├── socket-provider.tsx # WebSocket connection provider
│   │       └── game-canvas.tsx # Game rendering and interaction
│   └── public/               # Static assets
│       └── game-assets/      # Game SVG assets and sprites
├── backend/                  # Node.js backend with Express.js and Socket.IO
│   ├── package.json          # Backend dependencies (express, socket.io)
│   ├── src/                  # Source code directory
│   │   └── server.ts         # Backend server with Socket.IO
│   └── .env                  # Environment variables for backend
└── package.json              # Root package.json with scripts to manage both frontend and backend
```

### Key Files
- **`frontend/app/page.tsx`**: Contains the main game component, including the canvas for rendering and WebSocket connection logic.
- **`frontend/src/components/socket-provider.tsx`**: Provides a WebSocket connection context for the application.
- **`frontend/src/components/game-canvas.tsx`**: Handles game rendering, animations, and performance optimizations.
- **`backend/src/server.ts`**: Sets up the Express.js server and Socket.IO for handling real-time player connections and game state updates.
- **`package.json` (root)**: Includes scripts to install dependencies and run both the frontend and backend together.

### Dependencies
- **Frontend**:
  - NextJS
  - `socket.io-client` (for WebSocket communication)
  - TypeScript
- **Backend**:
  - `express`
  - `socket.io`
  - TypeScript
  - `dotenv` (for environment variables)

### Running the Project
- **Development**:
  - Install all dependencies: `npm run install:all`
  - Start both frontend and backend: `npm run dev`
- **Production**:
  - Build the frontend and backend: `npm run build`
  - Start the backend: `npm start`

---

## Todo List

This todo list breaks down the development process into actionable tasks. Each task should be checked off as it's completed.

### Frontend (NextJS)
- [X] Initialize a new NextJS project in the `frontend/` directory.
- [X] Install `socket.io-client` for WebSocket communication.
- [X] Create a game page (`app/page.tsx`) with a canvas element for rendering the game.
- [X] Implement WebSocket connection logic in the game component to connect to the backend.
- [X] Add event listeners for player inputs (e.g., mouse movements, keyboard inputs).
- [X] Render the game state on the canvas based on updates received from the server.
- [X] Add visual effects for gameplay events (e.g., eating animations).
- [X] Implement performance optimizations (canvas caching, viewport culling).
- [X] Create adaptive performance mode with automatic/manual control.

### Backend (Node.js with Express.js and Socket.IO)
- [X] Initialize a new Node.js project in the `backend/` directory.
- [X] Install `express` and `socket.io`.
- [X] Set up an Express.js server in `backend/src/server.ts`.
- [X] Integrate Socket.IO with the server to handle WebSocket connections.
- [X] Handle player connections and disconnections, logging them for verification.
- [X] Handle player input events on the backend side.
- [X] Implement a game loop to periodically update and broadcast the game state to all connected clients.

### Integration
- [X] Ensure the frontend successfully connects to the backend via WebSocket.
- [X] Send player input data (e.g., movement) from the frontend to the backend.
- [X] Receive and process game state updates on the frontend to reflect the current game state.

### Game Logic
- [X] Define the structure of the game state (e.g., player positions, scores, game objects).
- [X] Implement server-side logic to update the game state based on player inputs and game rules.
- [X] Broadcast the updated game state to all connected clients at regular intervals.

### Visual Enhancements
- [X] Create SVG assets for game entities (shrimps, food)
- [X] Implement asset preloading for improved performance
- [X] Add visual feedback for gameplay events (eating animations)
- [X] Improve UI layout and organization

### Deployment
- [X] Configure environment variables for production (e.g., `NEXT_PUBLIC_BACKEND_URL`, `PORT`).
- [ ] Build the NextJS frontend for production using `next build`.
- [ ] Set up a hosting platform for the backend (e.g., Heroku, AWS EC2, or a VPS).
- [ ] Deploy the backend and ensure the frontend connects to the deployed backend URL.

---

## Outcome-Based Roadmap

This roadmap outlines the major milestones of the project, each with a clear outcome to achieve. It helps track progress and ensures the project stays on course.

### Milestone 1: Project Setup ✅
- **Outcome**: A basic project structure with frontend and backend directories, and a root `package.json` to manage both.
- **Tasks**:
  - Initialize NextJS project in `frontend/`. ✅
  - Initialize Node.js project in `backend/`. ✅
  - Create root `package.json` with scripts to install dependencies and run both frontend and backend. ✅

### Milestone 2: Basic WebSocket Connection ✅
- **Outcome**: The frontend can connect to the backend via WebSocket, and connections are logged.
- **Tasks**:
  - Implement WebSocket connection logic in the frontend using `socket.io-client`. ✅
  - Set up Socket.IO server in the backend to accept connections. ✅
  - Log player connections and disconnections on the backend. ✅

### Milestone 3: Player Input Handling ✅
- **Outcome**: Players can send inputs (e.g., movement) to the server, and the server acknowledges receipt.
- **Tasks**:
  - Add event listeners for player inputs on the frontend (e.g., mouse movements). ✅
  - Send input data to the backend via WebSocket. ✅
  - Handle and log input events on the backend. ✅

### Milestone 4: Game State Management ✅
- **Outcome**: The server maintains a game state and broadcasts it to all connected clients.
- **Tasks**:
  - Define the game state structure (e.g., player positions, game objects). ✅
  - Implement a game loop on the server to update the game state periodically. ✅
  - Broadcast the updated game state to all connected clients. ✅

### Milestone 5: Rendering the Game ✅
- **Outcome**: The frontend renders the game based on the state received from the server.
- **Tasks**:
  - Receive game state updates on the frontend via WebSocket. ✅
  - Use the canvas API to render the game state (e.g., draw players, objects). ✅
  - Implement visual effects and animations. ✅

### Milestone 6: Performance Optimization ✅
- **Outcome**: The game runs smoothly with multiple entities and on various devices.
- **Tasks**:
  - Implement canvas caching for frequently rendered elements. ✅
  - Add viewport culling to only render visible entities. ✅
  - Create performance mode toggle with auto/manual options. ✅
  - Monitor FPS and adapt rendering quality accordingly. ✅

### Milestone 7: Deployment
- **Outcome**: The game is deployed and accessible online, with the frontend served by the backend.
- **Tasks**:
  - Build the NextJS frontend for production.
  - Configure the backend to serve the static frontend files.
  - Deploy the backend to a hosting platform and update the frontend to connect to the deployed backend.

---

## Additional Notes for Collaboration

- **Environment Variables**:
  - Use `NEXT_PUBLIC_BACKEND_URL` in the frontend to specify the backend WebSocket URL (e.g., `http://localhost:4000` for development, or the production URL).
  - Use `PORT` in the backend to set the server port (default: 4000).

- **TypeScript**:
  - Both frontend and backend use TypeScript for type safety.
  - Interfaces are used for defining types (e.g., `Player` interface).

- **Development Workflow**:
  - Run `npm run dev` from the root directory to start both frontend and backend development servers.
  - The frontend will be available at `http://localhost:3000`, and the backend at `http://localhost:4000`.

- **Game Features**:
  - Performance mode automatically activates when FPS drops below 40 or when there are more than 30 entities
  - Visual effects show colorful animations when food is consumed
  - SVG assets are cached as canvas elements for improved rendering performance

- **Production Considerations**:
  - The backend serves the static frontend files from the build output.
  - Ensure the hosting platform supports WebSocket connections (e.g., Heroku with WebSockets enabled).

- **Contributing**:
  - Follow the todo list and roadmap to implement features incrementally.
  - Test both frontend and backend changes thoroughly.
  - Update this document as necessary to reflect changes in the project structure or requirements.

---

This document provides a clear path for building the .io-style game, with a structured todo list, milestone-based roadmap, and detailed repository context. It ensures that all necessary steps are covered and provides enough information for other developers to contribute effectively.