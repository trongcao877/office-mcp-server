# Microsoft Office MCP Server

Server MCP (Microsoft Collaboration Platform) để tương tác với Microsoft Office. Server này cung cấp các API để làm việc với các ứng dụng Office như Word, Excel và PowerPoint qua Microsoft Graph API.

## Tính năng

- Xác thực với Microsoft Azure AD
- Quản lý tài liệu Word
  - Tạo, đọc, cập nhật, xóa tài liệu
  - Hỗ trợ chỉnh sửa cộng tác thời gian thực thông qua Socket.io
- Quản lý bảng tính Excel
  - Tạo, đọc, cập nhật, xóa bảng tính
  - Quản lý worksheet và dữ liệu
- Quản lý bài thuyết trình PowerPoint
  - Tạo, đọc, cập nhật, xóa bài thuyết trình

## Yêu cầu

- Node.js v14 trở lên
- Microsoft Azure AD tenant
- Đăng ký ứng dụng trên Azure AD với các quyền truy cập Microsoft Graph API

## Cài đặt

1. Clone repository:
```bash
git clone https://github.com/trongcao877/office-mcp-server.git
cd office-mcp-server
```

2. Cài đặt các dependencies:
```bash
npm install
```

3. Tạo file .env từ file .env.example và cấu hình các thông số:
```bash
cp .env.example .env
```

4. Cấu hình file .env với thông tin Azure AD của bạn:
```
PORT=3000
NODE_ENV=development

# Microsoft Azure AD Credentials
TENANT_ID=your_tenant_id
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Office API Endpoints
GRAPH_API_ENDPOINT=https://graph.microsoft.com/v1.0

# CORS Settings
CORS_ORIGIN=http://localhost:8080
```

5. Chạy server:
```bash
npm start
```

## API Endpoints

### Xác thực

- POST `/api/auth/login` - Đăng nhập và lấy token
- GET `/api/auth/me` - Lấy thông tin người dùng hiện tại

### Tài liệu Word

- GET `/api/documents` - Lấy danh sách tài liệu
- GET `/api/documents/:id` - Lấy thông tin tài liệu
- GET `/api/documents/:id/content` - Lấy nội dung tài liệu
- PUT `/api/documents/:id/content` - Cập nhật nội dung tài liệu
- POST `/api/documents` - Tạo tài liệu mới
- DELETE `/api/documents/:id` - Xóa tài liệu

### Bảng tính Excel

- GET `/api/spreadsheets` - Lấy danh sách bảng tính
- GET `/api/spreadsheets/:id` - Lấy thông tin bảng tính
- GET `/api/spreadsheets/:id/worksheets` - Lấy danh sách worksheets
- GET `/api/spreadsheets/:id/worksheets/:worksheetId/range` - Lấy dữ liệu từ range
- POST `/api/spreadsheets/:id/worksheets/:worksheetId/range` - Cập nhật dữ liệu range
- POST `/api/spreadsheets` - Tạo bảng tính mới
- DELETE `/api/spreadsheets/:id` - Xóa bảng tính

### Bài thuyết trình PowerPoint

- GET `/api/presentations` - Lấy danh sách bài thuyết trình
- GET `/api/presentations/:id` - Lấy thông tin bài thuyết trình
- POST `/api/presentations` - Tạo bài thuyết trình mới
- DELETE `/api/presentations/:id` - Xóa bài thuyết trình

## Socket.io Events

MCP Server sử dụng Socket.io để hỗ trợ chỉnh sửa tài liệu theo thời gian thực:

### Sự kiện từ client đến server:

- `joinDocument` - Tham gia vào phòng chỉnh sửa tài liệu (tham số: documentId)
- `documentChange` - Gửi thay đổi tài liệu (tham số: { documentId, changes, user })
- `disconnect` - Ngắt kết nối

### Sự kiện từ server đến client:

- `documentUpdate` - Nhận thay đổi tài liệu từ người dùng khác
- `userJoined` - Người dùng mới tham gia
- `userLeft` - Người dùng rời đi

## Bảo mật

- Sử dụng JWT cho xác thực API
- Tích hợp với Azure AD cho xác thực người dùng
- CORS được cấu hình để chỉ cho phép các nguồn được chỉ định

## Đăng ký ứng dụng trên Azure AD

1. Đăng nhập vào [Azure Portal](https://portal.azure.com)
2. Vào Azure Active Directory > App registrations > New registration
3. Đặt tên và cấu hình URI chuyển hướng
4. Lấy Client ID và Tenant ID từ trang tổng quan
5. Tạo Client Secret: Certificates & secrets > New client secret
6. Cấu hình API permissions trong phần API permissions:
   - Microsoft Graph API với các quyền:
     - Files.ReadWrite
     - Files.ReadWrite.All
     - Sites.ReadWrite.All
     - User.Read
     - User.ReadBasic.All

## Phát triển

### Cấu trúc dự án

```
office-mcp-server/
├── middleware/         # Middleware cho xác thực và xử lý lỗi
├── routes/             # API route handlers
├── .env                # Biến môi trường (không nên commit)
├── .env.example        # Mẫu cho biến môi trường
├── package.json        # Cấu hình npm
├── server.js           # Entry point
└── README.md           # Tài liệu
```

### Các lệnh hữu ích

- Khởi động server: `npm start`
- Khởi động server với nodemon (auto-reload): `npm run dev`

## Đóng góp

Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết thêm chi tiết về quy trình đóng góp.

## Giấy phép

Dự án này được cấp phép theo [Giấy phép MIT](LICENSE).