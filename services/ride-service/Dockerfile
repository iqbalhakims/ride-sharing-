FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/ride-service/package.json ./services/ride-service/
RUN npm install --workspace=packages/shared --workspace=services/ride-service
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared
COPY services/ride-service/ ./services/ride-service/
RUN npm run build --workspace=services/ride-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/services/ride-service/dist ./services/ride-service/dist
COPY --from=builder /app/services/ride-service/package.json ./services/ride-service/package.json
WORKDIR /app/services/ride-service
EXPOSE 3003
CMD ["node", "dist/index.js"]
