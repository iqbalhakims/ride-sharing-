FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/payment-service/package.json ./services/payment-service/
RUN npm install --workspace=packages/shared --workspace=services/payment-service
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared
COPY services/payment-service/ ./services/payment-service/
RUN npm run build --workspace=services/payment-service

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/payment-service/package.json ./services/payment-service/
RUN npm ci --omit=dev --workspace=packages/shared --workspace=services/payment-service && npm cache clean --force

FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=deps /app/services/payment-service/package.json ./services/payment-service/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/payment-service/dist ./services/payment-service/dist
COPY --from=builder /app/services/payment-service/src/db/migrations ./services/payment-service/dist/db/migrations
WORKDIR /app/services/payment-service
EXPOSE 3005
CMD ["dist/index.js"]
