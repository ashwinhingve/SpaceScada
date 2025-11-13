# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.12.0

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/protocols/package.json ./packages/protocols/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@8.12.0

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build packages
RUN pnpm --filter @webscada/shared-types build
RUN pnpm --filter @webscada/utils build
RUN pnpm --filter @webscada/protocols build

# Build backend
RUN pnpm --filter @webscada/backend build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/protocols/dist ./packages/protocols/dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3001

ENV PORT 3001
ENV HOST "0.0.0.0"

CMD ["node", "apps/backend/dist/index.js"]
