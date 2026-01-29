# Use Node.js 20 Alpine for smallest image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install only production dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["node", "index.js"]
