FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client tar \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package-lock.json ./apps/api/
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/

RUN npm ci

COPY . .

WORKDIR /app/apps/api

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3002

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
