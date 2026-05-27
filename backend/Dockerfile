FROM node:20-bookworm-slim AS builder

RUN apt-get update -qq && apt-get install -y -qq openssl wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runner

RUN apt-get update -qq && apt-get install -y -qq openssl wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
