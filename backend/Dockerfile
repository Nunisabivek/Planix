# Use Node.js 18
FROM node:18-alpine

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8080

# Start command with better error handling
CMD ["sh", "-c", "echo 'Starting server...' && npx prisma migrate deploy && echo 'Migration complete, starting app...' && node dist/index.js"]
