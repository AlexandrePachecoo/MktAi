# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/

RUN npm ci --workspace=packages/backend

COPY packages/backend ./packages/backend

# Build backend
RUN cd packages/backend && npx prisma generate && npm run build

# ─── Stage 2: Backend production image ─────────────────────────────────────────
FROM node:20-slim AS backend

WORKDIR /app

# openssl necessário para o Prisma em Debian slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/

RUN npm ci --omit=dev --workspace=packages/backend

COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY packages/backend/prisma ./packages/backend/prisma

WORKDIR /app/packages/backend

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
