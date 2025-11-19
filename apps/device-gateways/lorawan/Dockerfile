# LoRaWAN Gateway Dockerfile
# ChirpStack gRPC integration

FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/device-gateways/lorawan/package.json ./apps/device-gateways/lorawan/

RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter=@webscada/shared-types build
RUN pnpm --filter=@webscada/utils build
RUN pnpm --filter=lorawan-gateway build

FROM base AS runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 gateway

COPY --from=builder --chown=gateway:nodejs /app/apps/device-gateways/lorawan/dist ./apps/device-gateways/lorawan/dist
COPY --from=builder --chown=gateway:nodejs /app/packages ./packages
COPY --from=deps --chown=gateway:nodejs /app/node_modules ./node_modules

USER gateway

CMD ["node", "apps/device-gateways/lorawan/dist/index.js"]
