const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS for both Express and Socket.IO
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(express.json());
app.use(passport.initialize());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chattrbox', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Room management
const waitingUsers = new Set();
const activeRooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('find-partner', () => {
    if (waitingUsers.size > 0) {
      // Get the first waiting user
      const partnerId = Array.from(waitingUsers)[0];
      waitingUsers.delete(partnerId);
      
      // Create a new room
      const roomId = `room_${socket.id}_${partnerId}`;
      activeRooms.set(roomId, [socket.id, partnerId]);
      
      // Join both users to the room
      socket.join(roomId);
      io.to(partnerId).emit('user-joined', { roomId });
      socket.emit('user-joined', { roomId });
      
      console.log(`Created room ${roomId} with users ${socket.id} and ${partnerId}`);
    } else {
      // Add to waiting list
      waitingUsers.add(socket.id);
      console.log(`User ${socket.id} added to waiting list`);
    }
  });

  socket.on('signal', ({ signal, roomId, userId }) => {
    socket.to(roomId).emit('signal', { signal, userId });
  });

  socket.on('leave-room', (roomId) => {
    if (activeRooms.has(roomId)) {
      const [user1, user2] = activeRooms.get(roomId);
      io.to(user1).emit('partner-left');
      io.to(user2).emit('partner-left');
      activeRooms.delete(roomId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    waitingUsers.delete(socket.id);
    
    // Find and clean up any rooms this user was in
    for (const [roomId, users] of activeRooms.entries()) {
      if (users.includes(socket.id)) {
        const partnerId = users.find(id => id !== socket.id);
        if (partnerId) {
          io.to(partnerId).emit('partner-left');
        }
        activeRooms.delete(roomId);
      }
    }
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ChattrBox API' });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Access the server from other devices using your local IP address`);
}); 