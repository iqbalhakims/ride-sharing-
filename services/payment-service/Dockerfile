FROM node:20-alpine AS builder
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

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/services/payment-service/dist ./services/payment-service/dist
COPY --from=builder /app/services/payment-service/src/db/migrations ./services/payment-service/dist/db/migrations
COPY --from=builder /app/services/payment-service/package.json ./services/payment-service/package.json
WORKDIR /app/services/payment-service
EXPOSE 3005
CMD ["node", "dist/index.js"]
