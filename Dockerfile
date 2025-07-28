# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S businessmap && \
    adduser -S businessmap -u 1001

# Change ownership of the app directory
RUN chown -R businessmap:businessmap /app
USER businessmap

# Expose port (if using HTTP transport)
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "console.log('Health check')" || exit 1

# Start the server
CMD ["node", "dist/index.js"] 