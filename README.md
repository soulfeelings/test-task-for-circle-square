# 🦆 The Last of Guss

Браузерная игра, где игроки соревнуются в тапах по виртуальному гусю.

## 🚀 Быстрый запуск

```bash
# 1. Установить зависимости
make install

# 2. Настроить базу данных (нужен PostgreSQL на порту 5432)
make db-setup

# 3. Запустить полный стек
make start
```

Откройте http://localhost:5173 и играйте!

## 🎮 Как играть

1. **Введите имя**:

   - `admin` - создавать раунды
   - `Никита` - особая роль (без очков)
   - Любое другое имя - обычный игрок

2. **Тапайте по гусю**:

   - 1 тап = 1 очко
   - Каждый 11-й тап = 10 очков
   - Никита не получает очков

3. **Раунды**:
   - Cooldown (30 сек) → Активная игра (60 сек) → Завершение

## 📋 Команды

```bash
make start      # Запустить полный стек (фронт + бэк)
make frontend   # Только фронтенд
make backend    # Только бэкенд
make dev        # Только бэкенд (dev режим)
make build      # Собрать проект
make clean      # Очистить node_modules
make install    # Установить зависимости
make db-setup   # Настроить базу данных
make help       # Показать все команды
```

## 🛠 Технологии

- **Frontend**: React + TypeScript + Vite
- **Backend**: Fastify + PostgreSQL + Prisma
- **Локальный запуск**: Без Docker

## 🌐 Что запускается

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432 (нужно запустить отдельно)
- **WebSocket**: ws://localhost:3000/api/ws

## ⚙️ Требования

- Node.js 18+
- PostgreSQL 15+
- Yarn

## 📈 МАСШТАБИРОВАНИЕ

### Проблема с WebSocket при горизонтальном масштабировании

При запуске нескольких инстансов бекенда WebSocket соединения привязываются к конкретному инстансу. Это создает проблемы:

- **Sticky sessions** - пользователь должен всегда попадать на тот же инстанс
- **Потеря соединений** - при перезапуске инстанса WebSocket разрывается

### Решение для production: Redis Pub/Sub

**Простое и надежное решение** - добавить Redis для синхронизации событий между инстансами:

```typescript
// 1. Устанавливаем Redis
npm install redis

// 2. В каждом инстансе бекенда
import { createClient } from 'redis';

const redis = createClient({ url: 'redis://localhost:6379' });
await redis.connect();

// Подписываемся на события
redis.subscribe('game_events', (message) => {
  const event = JSON.parse(message);
  // Отправляем всем WebSocket клиентам этого инстанса
  broadcastToClients(event);
});

// Публикуем события
function publishEvent(event) {
  redis.publish('game_events', JSON.stringify(event));
}
```

### Архитектура

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend  │    │ Load Balancer│    │ Backend #1  │
│             │◄──►│   (nginx)    │◄──►│             │
└─────────────┘    └──────────────┘    └─────────────┘
                           │                    │
                           ▼                    ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ Backend #2  │    │    Redis    │
                   │             │◄──►│  (Pub/Sub)  │
                   └─────────────┘    └─────────────┘
```

**Результат**: Любой инстанс может отправить событие всем клиентам через Redis.
