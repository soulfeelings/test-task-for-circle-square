# Multi-stage build для оптимизации размера образа
FROM node:18-alpine AS base

# Установка OpenSSL и других зависимостей для Prisma
RUN apk add --no-cache openssl openssl-dev

# Установка зависимостей только для production
FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Development образ
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерация Prisma клиента
RUN yarn prisma generate

# Переменные окружения
ENV NODE_ENV=development
ENV PORT=3000

# Открытие порта
EXPOSE 3000

# Запуск в режиме разработки
CMD ["yarn", "dev"]

# Сборка приложения
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерация Prisma клиента
RUN yarn prisma generate

# Компиляция TypeScript
RUN yarn build

# Production образ
FROM base AS runner
WORKDIR /app

# Создание пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Копирование необходимых файлов
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Установка прав доступа
RUN chown -R nodejs:nodejs /app
USER nodejs

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=3000

# Открытие порта
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Запуск приложения
CMD ["node", "dist/index.js"]
