FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:18-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache curl \
    && addgroup -g 1001 -S businessmap \
    && adduser -S businessmap -u 1001 -G businessmap

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build --chown=businessmap:businessmap /app/dist ./dist

USER businessmap

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD-SHELL curl --fail --silent --show-error "http://localhost:${PORT:-3000}/health" || exit 1

CMD ["node", "dist/index.js"]