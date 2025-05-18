const { getGraphClient } = require('./auth');

/**
 * Xử lý lỗi middleware
 * Ghi log lỗi và trả về phản hồi lỗi
 */
const errorHandler = (err, req, res, next) => {
  console.error('Lỗi:', err.message);
  
  // Kiểm tra loại lỗi
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Không có quyền truy cập' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  
  // Mặc định: lỗi server
  res.status(500).json({
    message: 'Lỗi máy chủ nội bộ',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

/**
 * Middleware để kết nối với Microsoft Graph API
 * Thêm graphClient vào đối tượng request
 */
const connectGraphApi = (req, res, next) => {
  try {
    req.graphClient = getGraphClient();
    next();
  } catch (error) {
    console.error('Lỗi kết nối với Graph API:', error);
    res.status(500).json({
      message: 'Không thể kết nối với Microsoft Graph API',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware ghi log request
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = {
  errorHandler,
  connectGraphApi,
  requestLogger
};