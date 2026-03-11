FROM node:20-alpine AS builder
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

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/services/matching-service/dist ./services/matching-service/dist
COPY --from=builder /app/services/matching-service/package.json ./services/matching-service/package.json
WORKDIR /app/services/matching-service
EXPOSE 3004
CMD ["node", "dist/index.js"]
