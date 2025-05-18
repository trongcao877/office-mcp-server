const express = require('express');
const router = express.Router();
const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const jwt = require('jsonwebtoken');

// Middleware xác thực JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Tạo Microsoft Graph client
const getGraphClient = () => {
  const credential = new ClientSecretCredential(
    process.env.TENANT_ID,
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );
  
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default']
  });
  
  return Client.initWithMiddleware({
    authProvider: authProvider
  });
};

// Lấy danh sách bài thuyết trình
router.get('/', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    
    // Lấy danh sách tất cả các bài thuyết trình PowerPoint trong OneDrive
    const response = await graphClient
      .api('/me/drive/root/search(q=\'.pptx\')')
      .get();
    
    res.json(response.value);
  } catch (error) {
    console.error('Lỗi lấy danh sách bài thuyết trình:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Lấy thông tin bài thuyết trình
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const presentationId = req.params.id;
    
    // Lấy thông tin bài thuyết trình từ OneDrive
    const presentation = await graphClient
      .api(`/me/drive/items/${presentationId}`)
      .get();
    
    res.json(presentation);
  } catch (error) {
    console.error('Lỗi lấy thông tin bài thuyết trình:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Lấy danh sách slides
router.get('/:id/slides', authenticateToken, async (req, res) => {
  try {
    // Lưu ý: API Microsoft Graph không hỗ trợ trực tiếp truy cập vào các slide trong PowerPoint
    // Để thực hiện việc này, bạn cần sử dụng Office.js hoặc các API khác
    
    res.status(501).json({ message: 'Chức năng này chưa được triển khai' });
  } catch (error) {
    console.error('Lỗi lấy danh sách slides:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Tạo bài thuyết trình mới
router.post('/', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const { name } = req.body;
    
    // Tạo một bài thuyết trình PowerPoint mới trong OneDrive
    const driveItem = await graphClient
      .api('/me/drive/root/children')
      .post({
        name: `${name}.pptx`,
        file: {}
      });
    
    res.status(201).json(driveItem);
  } catch (error) {
    console.error('Lỗi tạo bài thuyết trình:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Xóa bài thuyết trình
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const presentationId = req.params.id;
    
    // Xóa bài thuyết trình từ OneDrive
    await graphClient
      .api(`/me/drive/items/${presentationId}`)
      .delete();
    
    res.json({ message: 'Bài thuyết trình đã được xóa thành công' });
  } catch (error) {
    console.error('Lỗi xóa bài thuyết trình:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

module.exports = router;