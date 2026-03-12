FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/ride-service/package.json ./services/ride-service/
RUN npm install --workspace=packages/shared --workspace=services/ride-service
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared
COPY services/ride-service/ ./services/ride-service/
RUN npm run build --workspace=services/ride-service

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/ride-service/package.json ./services/ride-service/
RUN npm ci --omit=dev --workspace=packages/shared --workspace=services/ride-service && npm cache clean --force

FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=deps /app/services/ride-service/package.json ./services/ride-service/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/ride-service/dist ./services/ride-service/dist
COPY --from=builder /app/services/ride-service/src/db/migrations ./services/ride-service/dist/db/migrations
WORKDIR /app/services/ride-service
EXPOSE 3003
CMD ["dist/index.js"]
