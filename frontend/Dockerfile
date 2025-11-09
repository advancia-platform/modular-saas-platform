# ===== Builder Stage =====
FROM node:18-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm install --prefer-offline --no-audit

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ===== Runner Stage =====
FROM node:18-alpine AS runner
WORKDIR /app

RUN if ! getent group nodejs >/dev/null 2>&1; then addgroup -g 1001 -S nodejs; fi \
    && if ! getent passwd nextjs >/dev/null 2>&1; then adduser -S nextjs -u 1001 -G nodejs; fi

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

CMD ["node", "server.js"]