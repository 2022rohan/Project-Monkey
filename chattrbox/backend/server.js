const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins in development
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: "*", // Allow all origins in development
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chattrbox', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io connection handling
const connectedUsers = new Set();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  connectedUsers.add(socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('signal', ({ signal, roomId, userId }) => {
    socket.to(roomId).emit('signal', { signal, userId });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedUsers.delete(socket.id);
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ChattrBox API' });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
}); 