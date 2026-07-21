FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package-lock.json ./apps/api/
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/

RUN npm ci

COPY . .

RUN npm run --workspace web build

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "run", "--workspace", "web", "start", "--", "-H", "0.0.0.0", "-p", "3001"]
