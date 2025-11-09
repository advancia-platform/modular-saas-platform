## Multi-stage Dockerfile to serve Next.js (standalone)

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build-time environment variables for Next.js (with safe defaults)
ARG NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
ARG NEXT_PUBLIC_APP_NAME="Advancia PayLedger"
ARG NEXT_PUBLIC_CURRENCY_LIST="USD,EUR,BTC,ETH,USDT,TRUMP,MEDBED"
ARG NEXT_PUBLIC_FEATURE_FLAGS="notifications,bonus_tokens,debit_card,crypto_recovery"
ARG NEXT_PUBLIC_VAPID_KEY
ARG NEXT_PUBLIC_API_KEY
ARG NEXT_PUBLIC_BOTPRESS_BOT_ID

# Set them as ENV so Next.js build can use them
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_CURRENCY_LIST=$NEXT_PUBLIC_CURRENCY_LIST
ENV NEXT_PUBLIC_FEATURE_FLAGS=$NEXT_PUBLIC_FEATURE_FLAGS
ENV NEXT_PUBLIC_VAPID_KEY=$NEXT_PUBLIC_VAPID_KEY
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_BOTPRESS_BOT_ID=$NEXT_PUBLIC_BOTPRESS_BOT_ID

# Copy only package manifests to leverage Docker cache
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci || npm install

# Copy app sources
COPY frontend/ ./

# Build (produces .next/standalone when output: 'standalone' is set)
RUN npm run build

# Production runner
FROM node:18-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy public assets and standalone server
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose default Next.js port (Render will map $PORT)
EXPOSE 3000

# Start the standalone server directly (no shell, no cd)
CMD ["node", "server.js"]
