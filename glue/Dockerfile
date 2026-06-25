# Multi-stage. Скелет; срез-1 уточнит сборку воркспейса.
# better-sqlite3 — нативный модуль, нужны build tools на этапе сборки.
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
COPY packages/contracts ./packages/contracts
COPY glue ./glue
RUN npm ci && npm run build -w @eios/contracts && npm run build -w @eios/glue

FROM node:22-alpine
WORKDIR /app
# node_modules/@eios/contracts — симлинк на ../../packages/contracts.
# Копируем packages/contracts целиком (с package.json + dist) чтобы симлинк резолвился.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/contracts ./packages/contracts
COPY --from=build /app/glue/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
