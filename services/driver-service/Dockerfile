FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/driver-service/package.json ./services/driver-service/
RUN npm install --workspace=packages/shared --workspace=services/driver-service
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared
COPY services/driver-service/ ./services/driver-service/
RUN npm run build --workspace=services/driver-service

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/driver-service/package.json ./services/driver-service/
RUN npm ci --omit=dev --workspace=packages/shared --workspace=services/driver-service && npm cache clean --force

FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=deps /app/services/driver-service/package.json ./services/driver-service/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/driver-service/dist ./services/driver-service/dist
COPY --from=builder /app/services/driver-service/src/db/migrations ./services/driver-service/dist/db/migrations
WORKDIR /app/services/driver-service
EXPOSE 3002
CMD ["dist/index.js"]
