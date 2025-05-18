# Hướng dẫn triển khai MCP Server

Tài liệu này hướng dẫn cách triển khai MCP Server trong các môi trường khác nhau.

## Triển khai trên máy chủ Linux

### Yêu cầu

- Node.js 14.x trở lên
- Nginx (cho reverse proxy)
- PM2 (quản lý quy trình Node.js)
- Git

### Các bước thực hiện

1. Cài đặt Node.js và npm:
```bash
# Sử dụng nvm để cài đặt Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.bashrc
nvm install 14
nvm use 14
```

2. Cài đặt PM2:
```bash
npm install -g pm2
```

3. Clone repository:
```bash
git clone https://github.com/trongcao877/office-mcp-server.git
cd office-mcp-server
```

4. Cài đặt dependencies:
```bash
npm install --production
```

5. Cấu hình môi trường:
```bash
cp .env.example .env
# Sửa file .env với các thông tin cấu hình cần thiết
```

6. Chạy ứng dụng với PM2:
```bash
pm2 start server.js --name mcp-server
pm2 save
pm2 startup
```

7. Cấu hình Nginx làm reverse proxy:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. Cấu hình SSL với Certbot:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Triển khai với Docker

### Chuẩn bị Dockerfile

1. Tạo Dockerfile:
```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

2. Tạo file docker-compose.yml:
```yaml
version: '3'

services:
  mcp-server:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    restart: always
```

3. Build và chạy container:
```bash
docker-compose up -d
```

## Triển khai lên các nền tảng cloud

### AWS Elastic Beanstalk

1. Cài đặt AWS CLI và EB CLI
2. Khởi tạo ứng dụng Elastic Beanstalk:
```bash
eb init
eb create mcp-server-production
```

### Microsoft Azure

1. Tạo Azure Web App
2. Cấu hình triển khai liên tục từ GitHub
3. Thêm các biến môi trường trong cấu hình ứng dụng

### Google Cloud Platform

1. Tạo một VM instance
2. Triển khai như trên máy chủ Linux hoặc sử dụng Docker
3. Cấu hình Cloud Load Balancer

## Theo dõi và bảo trì

### Giám sát

- Cấu hình giám sát với PM2
- Cấu hình cảnh báo cho các lỗi máy chủ
- Sử dụng công cụ giám sát như New Relic hoặc Datadog

### Sao lưu

- Sao lưu file cấu hình .env
- Sao lưu cơ sở dữ liệu nếu có
- Tự động hóa quy trình sao lưu

### Cập nhật

- Sao lưu trước khi cập nhật
- Chạy thử cập nhật trong môi trường kiểm thử
- Triển khai cập nhật vào khung giờ ít ảnh hưởng