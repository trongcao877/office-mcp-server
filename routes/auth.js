const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');

// Middleware để xác thực JWT
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

// Route đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Ở đây bạn sẽ cần xác thực người dùng bằng Office 365 hoặc Azure AD
    // Đây chỉ là ví dụ, trong thực tế cần tích hợp với OAuth flow
    
    // Tạo token cho người dùng đã xác thực
    const user = { id: '12345', username: username, role: 'user' };
    const accessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ accessToken });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

// Route lấy thông tin người dùng
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const graphClient = getGraphClient();
    
    // Lấy thông tin người dùng từ Microsoft Graph API
    const userInfo = await graphClient
      .api('/me')
      .select('displayName,mail,userPrincipalName')
      .get();
    
    res.json(userInfo);
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
});

module.exports = router;