FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY mock-univerkon/package*.json ./
RUN npm ci

COPY mock-univerkon/tsconfig.json ./
COPY mock-univerkon/src ./src
RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 9000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
