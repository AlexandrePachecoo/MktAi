# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/

RUN npm ci --workspace=packages/backend

COPY packages/backend ./packages/backend

# Build backend
RUN cd packages/backend && npx prisma generate && npm run build

# ─── Stage 2: Backend production image ─────────────────────────────────────────
FROM node:20-alpine AS backend

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/

RUN npm ci --omit=dev --workspace=packages/backend

COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY packages/backend/prisma ./packages/backend/prisma

WORKDIR /app/packages/backend

RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && node dist/index.js"]
