# Makefile для управления проектом "The Last of Guss"

.PHONY: help start stop dev prod build clean install setup db-setup

# Показать справку
help:
	@echo "Доступные команды:"
	@echo "  make start   - Запустить полный стек (dev режим)"
	@echo "  make stop    - Остановить все сервисы"
	@echo "  make dev     - Запустить в режиме разработки"
	@echo "  make prod    - Запустить в продакшн режиме"
	@echo "  make build   - Собрать образы"
	@echo "  make clean   - Очистить контейнеры и образы"
	@echo "  make setup   - Первоначальная настройка проекта"
	@echo "  make install - Установить зависимости локально"
	@echo "  make db-setup - Настроить базу данных"

# Основная команда для запуска всего стека
start: setup
	@echo "🚀 Запускаем полный стек игры 'The Last of Guss'..."
	docker compose --profile dev up --build -d
	@echo ""
	@echo "✅ Приложение запущено в detached режиме!"
	@echo ""
	@echo "📱 Фронтенд: http://localhost:5173"
	@echo "🔧 Бэкенд API: http://localhost:3000"
	@echo "🗄️  База данных: localhost:5432"
	@echo ""
	@echo "💡 Для остановки: make stop"
	@echo "📊 Для просмотра логов: docker compose logs -f"

# Остановка всех сервисов
stop:
	@echo "🛑 Останавливаем все сервисы..."
	docker compose down
	@echo "✅ Все сервисы остановлены"

# Первоначальная настройка
setup:
	@echo "📦 Настраиваем проект..."
	@if [ ! -f backend/.env ]; then \
		cp backend/env.example backend/.env; \
		echo "✅ Создан файл backend/.env"; \
	fi
	@echo "✅ Настройка завершена"

# Режим разработки
dev:
	docker compose --profile dev up --build

# Продакшн режим
prod:
	docker compose --profile prod up --build -d

# Сборка образов
build:
	docker compose build

# Очистка
clean:
	docker compose down --rmi all --volumes --remove-orphans
	docker system prune -f

# Настройка базы данных
db-setup:
	@echo "🗄️ Настраиваем базу данных..."
	docker compose --profile dev up postgres -d
	sleep 5
	cd backend && yarn prisma db push
	@echo "✅ База данных настроена"

# Локальная установка зависимостей
install:
	cd frontend && yarn install
	cd backend && yarn install

# Локальный запуск (без Docker)
dev-local:
	@echo "⚠️ Для локального запуска нужны:"
	@echo "  1. PostgreSQL на порту 5432"
	@echo "  2. Переменные окружения в backend/.env"
	@echo "  3. Выполнить: make db-setup"
	cd frontend && yarn dev

# Сборка для продакшна локально
build-local:
	cd frontend && yarn build
	cd backend && yarn build
