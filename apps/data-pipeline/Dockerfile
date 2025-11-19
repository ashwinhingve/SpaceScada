# Data Pipeline Service Dockerfile
# High-performance batch processing service

FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/data-pipeline/package.json ./apps/data-pipeline/

RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter=@webscada/shared-types build
RUN pnpm --filter=@webscada/utils build
RUN pnpm --filter=data-pipeline build

FROM base AS runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 pipeline

COPY --from=builder --chown=pipeline:nodejs /app/apps/data-pipeline/dist ./apps/data-pipeline/dist
COPY --from=builder --chown=pipeline:nodejs /app/packages ./packages
COPY --from=deps --chown=pipeline:nodejs /app/node_modules ./node_modules

USER pipeline

CMD ["node", "apps/data-pipeline/dist/index.js"]
