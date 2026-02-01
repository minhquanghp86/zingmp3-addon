# Base image: Node.js 20 Alpine
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache ca-certificates curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application files
COPY server.js ./
COPY dist/ ./dist/
COPY public/ ./public/

# Expose port
EXPOSE 5555

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -sf http://localhost:5555/ || exit 1

# Run server
CMD ["node", "server.js"]
