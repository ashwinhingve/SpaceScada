# Alarm Engine Service Dockerfile
# Real-time alarm processing and notifications

FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/utils/package.json ./packages/utils/
COPY services/alarm-engine/package.json ./services/alarm-engine/

RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter=@webscada/shared-types build
RUN pnpm --filter=@webscada/utils build
RUN pnpm --filter=alarm-engine build

FROM base AS runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 alarm

COPY --from=builder --chown=alarm:nodejs /app/services/alarm-engine/dist ./services/alarm-engine/dist
COPY --from=builder --chown=alarm:nodejs /app/packages ./packages
COPY --from=deps --chown=alarm:nodejs /app/node_modules ./node_modules

USER alarm

CMD ["node", "services/alarm-engine/dist/index.js"]
