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

// Lấy danh sách tài liệu
router.get('/', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    
    // Lấy danh sách tất cả các tài liệu Word trong OneDrive
    const response = await graphClient
      .api('/me/drive/root/search(q=\'.docx\')')
      .get();
    
    res.json(response.value);
  } catch (error) {
    console.error('Lỗi lấy danh sách tài liệu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Lấy thông tin tài liệu
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const documentId = req.params.id;
    
    // Lấy thông tin tài liệu từ OneDrive
    const document = await graphClient
      .api(`/me/drive/items/${documentId}`)
      .get();
    
    res.json(document);
  } catch (error) {
    console.error('Lỗi lấy thông tin tài liệu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Lấy nội dung tài liệu
router.get('/:id/content', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const documentId = req.params.id;
    
    // Lấy nội dung tài liệu dưới dạng text
    const content = await graphClient
      .api(`/me/drive/items/${documentId}/content`)
      .get();
    
    res.send(content);
  } catch (error) {
    console.error('Lỗi lấy nội dung tài liệu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Cập nhật tài liệu
router.put('/:id/content', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const documentId = req.params.id;
    const content = req.body.content;
    
    // Cập nhật nội dung tài liệu
    await graphClient
      .api(`/me/drive/items/${documentId}/content`)
      .put(content);
    
    res.json({ message: 'Tài liệu đã được cập nhật thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật tài liệu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Tạo tài liệu mới
router.post('/', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const { name, content } = req.body;
    
    // Tạo một tài liệu Word mới trong OneDrive
    const driveItem = await graphClient
      .api('/me/drive/root/children')
      .post({
        name: `${name}.docx`,
        file: {}
      });
    
    // Cập nhật nội dung tài liệu
    if (content) {
      await graphClient
        .api(`/me/drive/items/${driveItem.id}/content`)
        .put(content);
    }
    
    res.status(201).json(driveItem);
  } catch (error) {
    console.error('Lỗi tạo tài liệu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Xóa tài liệu
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const documentId = req.params.id;
    
    // Xóa tài liệu từ OneDrive
    await graphClient
      .api(`/me/drive/items/${documentId}`)
      .delete();
    
    res.json({ message: 'Tài liệu đã được xóa thành công' });
  } catch (error) {
    console.error('Lỗi xóa tài liệu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

module.exports = router;