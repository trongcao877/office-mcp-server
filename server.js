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

// Import middleware
const { errorHandler, requestLogger } = require('./middleware');

// Import socket.io setup
const setupSocketIO = require('./socket');

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

// Setup socket.io
setupSocketIO(io);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/spreadsheets', spreadsheetRoutes);
app.use('/api/presentations', presentationRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('MCP Server đang chạy');
});

// Error handler middleware
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
  console.log(`Môi trường: ${process.env.NODE_ENV}`);
});

// Xử lý tín hiệu tắt server
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  console.log('Đóng server HTTP');
  server.close(() => {
    console.log('HTTP server đã đóng');
    process.exit(0);
  });
});

module.exports = { app, server, io };