# Backend Dockerfile
FROM node:18

# Thư mục làm việc trong container
WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci

# Copy toàn bộ code
COPY . .

# Mở port 5000
EXPOSE 5000

# Lệnh chạy backend
CMD ["npm", "start"]
