# Tier 2: Self-contained OpenIPTV Portable Container
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json ./
RUN npm install --omit=dev --no-audit

COPY dist ./dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/iptv-org/catalog || exit 1

CMD ["node", "dist/server/index.js"]
