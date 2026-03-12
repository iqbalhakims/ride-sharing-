FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/auth-service/package.json ./services/auth-service/
RUN npm install --workspace=packages/shared --workspace=services/auth-service
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared
COPY services/auth-service/ ./services/auth-service/
RUN npm run build --workspace=services/auth-service

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/auth-service/package.json ./services/auth-service/
RUN npm ci --omit=dev --workspace=packages/shared --workspace=services/auth-service && npm cache clean --force

FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=deps /app/services/auth-service/package.json ./services/auth-service/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/auth-service/src/db/migrations ./services/auth-service/dist/db/migrations
WORKDIR /app/services/auth-service
EXPOSE 3001
CMD ["dist/index.js"]
