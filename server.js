const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const documentsRoutes = require('./routes/documents');
const spreadsheetRoutes = require('./routes/spreadsheets');
const presentationRoutes = require('./routes/presentations');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/spreadsheets', spreadsheetRoutes);
app.use('/api/presentations', presentationRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('MCP Server đang chạy');
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join a document collaboration room
  socket.on('joinDocument', (documentId) => {
    socket.join(`document-${documentId}`);
    console.log(`Client ${socket.id} joined document: ${documentId}`);
  });
  
  // Handle document changes
  socket.on('documentChange', (data) => {
    socket.to(`document-${data.documentId}`).emit('documentUpdate', data);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});

module.exports = { app, server, io };