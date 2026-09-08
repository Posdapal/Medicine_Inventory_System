# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install build tools required for native C++ modules (e.g. bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

# ---- Stage 2: Runtime Production Image ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8081

# Create and use non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY migrations/ ./migrations/

USER appuser

EXPOSE 8081

CMD ["node", "server.js"]
