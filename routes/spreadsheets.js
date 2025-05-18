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

// Lấy danh sách bảng tính
router.get('/', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    
    // Lấy danh sách tất cả các bảng tính Excel trong OneDrive
    const response = await graphClient
      .api('/me/drive/root/search(q=\'.xlsx\')')
      .get();
    
    res.json(response.value);
  } catch (error) {
    console.error('Lỗi lấy danh sách bảng tính:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Lấy thông tin bảng tính
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const spreadsheetId = req.params.id;
    
    // Lấy thông tin bảng tính từ OneDrive
    const spreadsheet = await graphClient
      .api(`/me/drive/items/${spreadsheetId}`)
      .get();
    
    res.json(spreadsheet);
  } catch (error) {
    console.error('Lỗi lấy thông tin bảng tính:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Lấy danh sách worksheets
router.get('/:id/worksheets', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const spreadsheetId = req.params.id;
    
    // Lấy danh sách tất cả các worksheets trong bảng tính
    const worksheets = await graphClient
      .api(`/me/drive/items/${spreadsheetId}/workbook/worksheets`)
      .get();
    
    res.json(worksheets.value);
  } catch (error) {
    console.error('Lỗi lấy danh sách worksheets:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Lấy dữ liệu từ worksheet
router.get('/:id/worksheets/:worksheetId/range', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const spreadsheetId = req.params.id;
    const worksheetId = req.params.worksheetId;
    const range = req.query.range || 'A1:Z100'; // Mặc định lấy một phạm vi lớn
    
    // Lấy dữ liệu từ phạm vi được chỉ định
    const rangeData = await graphClient
      .api(`/me/drive/items/${spreadsheetId}/workbook/worksheets/${worksheetId}/range(address='${range}')`)
      .get();
    
    res.json(rangeData);
  } catch (error) {
    console.error('Lỗi lấy dữ liệu từ worksheet:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Cập nhật dữ liệu trong worksheet
router.post('/:id/worksheets/:worksheetId/range', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const spreadsheetId = req.params.id;
    const worksheetId = req.params.worksheetId;
    const { range, values } = req.body;
    
    if (!range || !values) {
      return res.status(400).json({ message: 'Thiếu thông tin phạm vi hoặc giá trị' });
    }
    
    // Cập nhật dữ liệu vào phạm vi được chỉ định
    await graphClient
      .api(`/me/drive/items/${spreadsheetId}/workbook/worksheets/${worksheetId}/range(address='${range}')`)
      .patch({
        values: values
      });
    
    res.json({ message: 'Dữ liệu đã được cập nhật thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật dữ liệu trong worksheet:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Tạo bảng tính mới
router.post('/', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const { name } = req.body;
    
    // Tạo một bảng tính Excel mới trong OneDrive
    const driveItem = await graphClient
      .api('/me/drive/root/children')
      .post({
        name: `${name}.xlsx`,
        file: {}
      });
    
    res.status(201).json(driveItem);
  } catch (error) {
    console.error('Lỗi tạo bảng tính:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Xóa bảng tính
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    const spreadsheetId = req.params.id;
    
    // Xóa bảng tính từ OneDrive
    await graphClient
      .api(`/me/drive/items/${spreadsheetId}`)
      .delete();
    
    res.json({ message: 'Bảng tính đã được xóa thành công' });
  } catch (error) {
    console.error('Lỗi xóa bảng tính:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

module.exports = router;