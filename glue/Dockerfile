# Multi-stage. Скелет; срез-1 уточнит сборку воркспейса.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY packages/contracts ./packages/contracts
COPY glue ./glue
RUN npm install && npm run build -w @eios/contracts && npm run build -w @eios/glue

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/glue/dist ./dist
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
