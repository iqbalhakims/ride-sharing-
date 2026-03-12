FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/notification-service/package.json ./services/notification-service/
RUN npm install --workspace=packages/shared --workspace=services/notification-service
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared
COPY services/notification-service/ ./services/notification-service/
RUN npm run build --workspace=services/notification-service

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/notification-service/package.json ./services/notification-service/
RUN npm ci --omit=dev --workspace=packages/shared --workspace=services/notification-service && npm cache clean --force

FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=deps /app/services/notification-service/package.json ./services/notification-service/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist
WORKDIR /app/services/notification-service
EXPOSE 3006
CMD ["dist/index.js"]
