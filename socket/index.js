// Cấu hình socket.io cho MCP Server
const jwt = require('jsonwebtoken');
const { getGraphClient } = require('../middleware/auth');

/**
 * Khởi tạo và cấu hình Socket.io
 * @param {Object} io - Đối tượng Socket.io server
 */
const setupSocketIO = (io) => {
  // Middleware xác thực socket.io
  io.use((socket, next) => {
    // Lấy token từ query parameters
    const token = socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Xác thực không hợp lệ'));
    }
    
    // Xác thực token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Xác thực không hợp lệ'));
      }
      
      // Lưu thông tin người dùng vào socket
      socket.user = decoded;
      next();
    });
  });
  
  // Xử lý kết nối
  io.on('connection', (socket) => {
    console.log(`Người dùng ${socket.user.username} đã kết nối: ${socket.id}`);
    
    // Người dùng tham gia vào phòng chỉnh sửa tài liệu
    socket.on('joinDocument', (documentId) => {
      // Tạo tên phòng dựa trên ID tài liệu
      const room = `document-${documentId}`;
      
      // Tham gia phòng
      socket.join(room);
      console.log(`Người dùng ${socket.user.username} đã tham gia tài liệu: ${documentId}`);
      
      // Thông báo cho các người dùng khác
      socket.to(room).emit('userJoined', {
        userId: socket.user.id,
        username: socket.user.username
      });
    });
    
    // Xử lý thay đổi tài liệu
    socket.on('documentChange', (data) => {
      if (!data || !data.documentId || !data.changes) {
        return;
      }
      
      const room = `document-${data.documentId}`;
      
      // Gửi thay đổi đến tất cả các người dùng khác trong cùng tài liệu
      socket.to(room).emit('documentUpdate', {
        documentId: data.documentId,
        changes: data.changes,
        user: {
          id: socket.user.id,
          username: socket.user.username
        },
        timestamp: new Date().toISOString()
      });
    });
    
    // Xử lý người dùng rời đi
    socket.on('leaveDocument', (documentId) => {
      const room = `document-${documentId}`;
      
      // Rời khỏi phòng
      socket.leave(room);
      console.log(`Người dùng ${socket.user.username} đã rời tài liệu: ${documentId}`);
      
      // Thông báo cho các người dùng khác
      socket.to(room).emit('userLeft', {
        userId: socket.user.id,
        username: socket.user.username
      });
    });
    
    // Xử lý ngắt kết nối
    socket.on('disconnect', () => {
      console.log(`Người dùng ${socket.user.username} đã ngắt kết nối: ${socket.id}`);
      
      // Gửi thông báo đến tất cả các phòng mà người dùng đã tham gia
      const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
      
      rooms.forEach(room => {
        socket.to(room).emit('userLeft', {
          userId: socket.user.id,
          username: socket.user.username
        });
      });
    });
  });
};

module.exports = setupSocketIO;