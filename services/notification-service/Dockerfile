FROM node:20-alpine AS builder
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

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist
COPY --from=builder /app/services/notification-service/package.json ./services/notification-service/package.json
WORKDIR /app/services/notification-service
EXPOSE 3006
CMD ["node", "dist/index.js"]
