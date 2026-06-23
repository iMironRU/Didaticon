FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY packages/contracts ./packages/contracts
COPY pwa ./pwa
RUN npm ci && npm run build -w @eios/contracts && npm run build -w @eios/pwa

FROM nginx:alpine
COPY --from=build /app/pwa/dist /usr/share/nginx/html
COPY pwa/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
