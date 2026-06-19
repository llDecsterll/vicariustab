# Release
# Vicariustab — production image (Express + static Vite build)
# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096
# Faster, reliable Linux builds on low-RAM hosts (still minified)
ENV SKIP_OBFUSCATION=true
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

ENV NODE_ENV=production
ENV PORT=8080
ENV STACK_DATA_DIR=/app/data

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN mkdir -p /app/data \
  && addgroup -S vicariustab && adduser -S vicariustab -G vicariustab \
  && chown -R vicariustab:vicariustab /app
USER vicariustab

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/update/repo" >/dev/null 2>&1 || exit 1

CMD ["node", "dist/server.cjs"]
