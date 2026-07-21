# Use official Node.js lightweight image
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Install build dependencies for sqlite3 (if binary rebuild is needed)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# Production image
FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
# Only install production dependencies
RUN npm install --omit=dev

# Copy necessary project files from builder and source
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

# Set default env variables
ENV PORT=8080
ENV NODE_ENV=production

# Expose port and start
EXPOSE 8080
CMD ["npm", "start"]
