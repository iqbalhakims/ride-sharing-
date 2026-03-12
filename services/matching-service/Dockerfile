FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/matching-service/package.json ./services/matching-service/
RUN npm install --workspace=packages/shared --workspace=services/matching-service
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared
COPY services/matching-service/ ./services/matching-service/
RUN npm run build --workspace=services/matching-service

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/matching-service/package.json ./services/matching-service/
RUN npm ci --omit=dev --workspace=packages/shared --workspace=services/matching-service && npm cache clean --force

FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=deps /app/services/matching-service/package.json ./services/matching-service/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/matching-service/dist ./services/matching-service/dist
WORKDIR /app/services/matching-service
EXPOSE 3004
CMD ["dist/index.js"]
