# Unified API Service Dockerfile
# Production-grade Node.js 20 + TypeScript

FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/protocols/package.json ./packages/protocols/
COPY apps/unified-api/package.json ./apps/unified-api/

RUN pnpm install --frozen-lockfile --prod=false

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared packages first
RUN pnpm --filter=@webscada/shared-types build
RUN pnpm --filter=@webscada/utils build
RUN pnpm --filter=@webscada/protocols build

# Build unified-api
RUN pnpm --filter=unified-api build

# Production stage
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3001

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify

# Copy built artifacts
COPY --from=builder --chown=fastify:nodejs /app/apps/unified-api/dist ./apps/unified-api/dist
COPY --from=builder --chown=fastify:nodejs /app/packages ./packages
COPY --from=deps --chown=fastify:nodejs /app/node_modules ./node_modules

# Create logs directory
RUN mkdir -p /app/logs && chown fastify:nodejs /app/logs

USER fastify

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/unified-api/dist/index.js"]
