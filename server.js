const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

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
app.use(helmet()); // Bảo mật HTTP headers
app.use(compression()); // Nén phản hồi
app.use(morgan('combined')); // Ghi log chi tiết
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestLogger);

// Giới hạn tải lên
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware bảo mật rate limiting
if (process.env.NODE_ENV === 'production') {
  const rateLimit = require('express-rate-limit');
  
  // Giới hạn số lượng request
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // giới hạn mỗi IP thực hiện 100 request trong 15 phút
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/api/', apiLimiter);
}

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

// Xử lý các route không tồn tại
app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy tài nguyên' });
});

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

// Xử lý lỗi không được xử lý
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Gửi thông báo đến quản trị viên trong môi trường thực
  if (process.env.NODE_ENV === 'production') {
    // Thêm code để gửi email hoặc thông báo đến người quản trị
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { app, server, io };