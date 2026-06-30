FROM node:22-alpine AS builder
WORKDIR /app

COPY mock-univerkon/package.json ./
RUN npm install --ignore-scripts

COPY mock-univerkon/tsconfig.json ./
COPY mock-univerkon/src ./src

RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

COPY mock-univerkon/package.json ./
RUN npm install --omit=dev --ignore-scripts && \
    npm rebuild better-sqlite3 --build-from-source

COPY --from=builder /app/dist ./dist

EXPOSE 9000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
