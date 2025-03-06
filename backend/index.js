const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/out')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/out/index.html')));
}

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);
  socket.on('disconnect', () => console.log('Player disconnected:', socket.id));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));