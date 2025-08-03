# マルチステージビルドで高速化
# ステージ1: 依存関係のインストール
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 依存関係のみコピー（package-lock.jsonの存在確認付き）
COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --cache /tmp/.npm --prefer-offline --no-audit --no-fund; \
    else \
      npm install --cache /tmp/.npm --prefer-offline --no-audit --no-fund; \
    fi

# ステージ2: ビルド
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 依存関係を前ステージからコピー
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# tsconfig.jsonが確実にコピーされていることを確認
RUN ls -la tsconfig.json

# 環境変数設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_SHARP_PATH=/app/node_modules/sharp

# ビルド実行（SWC使用で高速化）
RUN npm run build

# ステージ3: 本番用最小イメージ
FROM node:18-alpine AS runner
WORKDIR /app

# セキュリティ設定
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルのみコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# publicディレクトリは存在しない（favicon.icoはsrc/app内にある）

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# 起動コマンド
CMD ["node", "server.js"]