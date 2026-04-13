# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

RUN npm ci

COPY packages/backend ./packages/backend
COPY packages/frontend ./packages/frontend

# Build backend
RUN cd packages/backend && npx prisma generate && npm run build

# Build frontend
RUN cd packages/frontend && npm run build

# ─── Stage 2: Backend production image ─────────────────────────────────────────
FROM node:20-alpine AS backend

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/

RUN npm ci --omit=dev --workspace=packages/backend

COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY packages/backend/prisma ./packages/backend/prisma

WORKDIR /app/packages/backend

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
