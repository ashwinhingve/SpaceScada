# OTA Service Dockerfile
# Over-the-air firmware update management

FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/utils/package.json ./packages/utils/
COPY services/ota-service/package.json ./services/ota-service/

RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter=@webscada/shared-types build
RUN pnpm --filter=@webscada/utils build
RUN pnpm --filter=ota-service build

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 ota

RUN mkdir -p /var/lib/firmware && chown ota:nodejs /var/lib/firmware

COPY --from=builder --chown=ota:nodejs /app/services/ota-service/dist ./services/ota-service/dist
COPY --from=builder --chown=ota:nodejs /app/packages ./packages
COPY --from=deps --chown=ota:nodejs /app/node_modules ./node_modules

USER ota

EXPOSE 8080

CMD ["node", "services/ota-service/dist/index.js"]
