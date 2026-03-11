FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/driver-service/package.json ./services/driver-service/
RUN npm install --workspace=packages/shared --workspace=services/driver-service
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared
COPY services/driver-service/ ./services/driver-service/
RUN npm run build --workspace=services/driver-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/services/driver-service/dist ./services/driver-service/dist
COPY --from=builder /app/services/driver-service/package.json ./services/driver-service/package.json
WORKDIR /app/services/driver-service
EXPOSE 3002
CMD ["node", "dist/index.js"]
