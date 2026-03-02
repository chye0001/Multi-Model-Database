# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client first (needed for TypeScript compilation)
# Use a dummy POSTGRES_DATABASE_URL since we only need to generate types, not connect
RUN POSTGRES_DATABASE_URL="postgresql://user:password@localhost:5432/dummy" npx prisma generate

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for migrations)
RUN npm ci

# Copy built application from builder
COPY --from=builder /app/database ./database

# Copy source for runtime (if needed)
COPY app.ts ./
COPY tsconfig.json ./
COPY prisma.config.ts ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/healthcheck', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application with tsx loader
CMD ["node", "--import", "tsx", "app.ts"]