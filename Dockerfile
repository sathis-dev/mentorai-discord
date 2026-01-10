FROM node:20-slim

WORKDIR /app

# Install minimal dependencies (wget for health check)
RUN apt-get update && apt-get install -y \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Cache bust arg
ARG CACHEBUST=1

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install for better compatibility)
RUN npm install --omit=dev && npm cache clean --force

# Copy source code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/index.js"]
