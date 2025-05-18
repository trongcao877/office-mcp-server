FROM node:14-alpine

LABEL maintainer="caonguyen.hbl@gmail.com"
LABEL description="MCP Server cho Microsoft Office"

# Tạo thư mục ứng dụng
WORKDIR /app

# Cài đặt dependencies trước
COPY package*.json ./
RUN npm install --production

# Sao chép các file còn lại vào container
COPY . .

# Expose cổng mặc định
EXPOSE 3000

# Khởi động ứng dụng
CMD ["node", "server.js"]