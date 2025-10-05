# Backend для игры "The Last of Guss"

## Описание

Бекенд для браузерной игры "The Last of Guss" на Fastify, PostgreSQL и Prisma.

## Технологии

- **Fastify** - веб-фреймворк
- **PostgreSQL** - база данных
- **Prisma** - ORM
- **TypeScript** - типизация
- **Docker** - контейнеризация

## Структура проекта

```
src/
├── routes/          # API маршруты
├── services/        # Бизнес-логика
├── middleware/      # Middleware
├── types/          # TypeScript типы
├── utils/          # Утилиты
└── index.ts        # Точка входа
```

## API Endpoints

### Аутентификация

- `GET /api/me` - получить текущего пользователя
- `POST /api/users` - создать пользователя
- `GET /api/users` - получить всех пользователей

### Раунды

- `GET /api/rounds` - получить все раунды
- `POST /api/rounds` - создать раунд (только admin)
- `GET /api/rounds/:id` - получить раунд по ID
- `GET /api/rounds/active` - получить активный раунд
- `PATCH /api/rounds/:id/status` - обновить статус раунда

### Тапы

- `POST /api/taps` - обработать тап
- `GET /api/taps/stats/:roundId` - статистика пользователя для раунда
- `GET /api/taps/user/:roundId` - тапы пользователя для раунда

### Статистика

- `GET /api/rounds/:id/stats` - статистика раунда

### WebSocket

- `WS /api/ws` - WebSocket соединение для real-time обновлений

## Запуск

### Локально

1. Установить зависимости:

```bash
yarn install
```

2. Настроить переменные окружения:

```bash
cp env.example .env
```

3. Запустить PostgreSQL и создать базу данных

4. Выполнить миграции:

```bash
yarn db:push
```

5. Запустить в режиме разработки:

```bash
yarn dev
```

### Docker

```bash
# Запуск всего стека
docker-compose --profile dev up

# Только бекенд + база данных
docker-compose --profile dev up postgres backend
```

## Конфигурация

Переменные окружения:

- `DATABASE_URL` - URL подключения к PostgreSQL
- `PORT` - порт сервера (по умолчанию 3000)
- `NODE_ENV` - окружение (development/production)
- `ROUND_DURATION` - длительность раунда в секундах (по умолчанию 60)
- `COOLDOWN_DURATION` - длительность cooldown в секундах (по умолчанию 30)

## Особенности

### Консистентность данных

Все операции с тапами выполняются в транзакциях для обеспечения консистентности.

### Роли пользователей

- `SURVIVOR` - обычный игрок
- `NIKITA` - игрок, который не получает очков
- `ADMIN` - может создавать раунды

### Логика очков

- Каждый тап = 1 очко
- Каждый 11-й тап = 10 очков
- Никита всегда получает 0 очков

### Real-time обновления

WebSocket для обновления статуса раундов и статистики в реальном времени.
