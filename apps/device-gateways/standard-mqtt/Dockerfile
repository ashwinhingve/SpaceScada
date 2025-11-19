# Standard MQTT Gateway Dockerfile
# Sparkplug B protocol support

FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/protocols/package.json ./packages/protocols/
COPY apps/device-gateways/standard-mqtt/package.json ./apps/device-gateways/standard-mqtt/

RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter=@webscada/shared-types build
RUN pnpm --filter=@webscada/utils build
RUN pnpm --filter=@webscada/protocols build
RUN pnpm --filter=mqtt-gateway build

FROM base AS runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 gateway

COPY --from=builder --chown=gateway:nodejs /app/apps/device-gateways/standard-mqtt/dist ./apps/device-gateways/standard-mqtt/dist
COPY --from=builder --chown=gateway:nodejs /app/packages ./packages
COPY --from=deps --chown=gateway:nodejs /app/node_modules ./node_modules

USER gateway

CMD ["node", "apps/device-gateways/standard-mqtt/dist/index.js"]
