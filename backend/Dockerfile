# Base Image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port (Railway uses PORT env var, default 8080)
EXPOSE 8080

# Start application
CMD ["npm", "start"]
