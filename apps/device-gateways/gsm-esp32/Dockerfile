# GSM ESP32 Gateway Dockerfile
# Handles cellular MQTT devices

FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/protocols/package.json ./packages/protocols/
COPY apps/device-gateways/gsm-esp32/package.json ./apps/device-gateways/gsm-esp32/

RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter=@webscada/shared-types build
RUN pnpm --filter=@webscada/utils build
RUN pnpm --filter=@webscada/protocols build
RUN pnpm --filter=gsm-esp32-gateway build

FROM base AS runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 gateway

COPY --from=builder --chown=gateway:nodejs /app/apps/device-gateways/gsm-esp32/dist ./apps/device-gateways/gsm-esp32/dist
COPY --from=builder --chown=gateway:nodejs /app/packages ./packages
COPY --from=deps --chown=gateway:nodejs /app/node_modules ./node_modules

USER gateway

CMD ["node", "apps/device-gateways/gsm-esp32/dist/index.js"]
