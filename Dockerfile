# Uvwstack — production image (Express API + Vite static assets)
# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

# Native addons (pg/mysql2) may need build tools on Alpine
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite client bundle + esbuild server bundle
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

# --- Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN addgroup -S uvwstack && adduser -S uvwstack -G uvwstack \
  && chown -R uvwstack:uvwstack /app
USER uvwstack

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/update/repo" >/dev/null 2>&1 || exit 1

CMD ["node", "dist/server.cjs"]
