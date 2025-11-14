# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.12.0

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/simulator/package.json ./apps/simulator/
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

# Build simulator
RUN pnpm --filter @webscada/simulator build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Install pnpm
RUN npm install -g pnpm@8.12.0

# Copy package files
COPY --from=deps /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=deps /app/apps/simulator/package.json ./apps/simulator/
COPY --from=deps /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=deps /app/packages/utils/package.json ./packages/utils/
COPY --from=deps /app/packages/protocols/package.json ./packages/protocols/

# Install production dependencies only (ignore scripts to skip husky)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/simulator/dist ./apps/simulator/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/protocols/dist ./packages/protocols/dist

USER nodejs

EXPOSE 5020

ENV SIMULATOR_PORT=5020

CMD ["node", "apps/simulator/dist/index.js"]
