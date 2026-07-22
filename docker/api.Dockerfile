FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    openssl ca-certificates postgresql-client tar krb5-user smbclient \
    libreoffice-core libreoffice-writer libreoffice-calc libreoffice-impress fonts-dejavu-core \
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
