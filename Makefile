# Makefile для управления проектом "The Last of Guss" (локальный запуск)

.PHONY: help start stop dev build clean install setup db-setup

# Показать справку
help:
	@echo "Доступные команды:"
	@echo "  make start   - Запустить полный стек локально"
	@echo "  make stop    - Остановить все процессы"
	@echo "  make dev     - Запустить в режиме разработки"
	@echo "  make build   - Собрать проект"
	@echo "  make clean   - Очистить node_modules"
	@echo "  make setup   - Первоначальная настройка проекта"
	@echo "  make install - Установить зависимости"
	@echo "  make db-setup - Настроить базу данных"

# Основная команда для запуска всего стека
start: setup
	@echo "🚀 Запускаем полный стек игры 'The Last of Guss' локально..."
	@echo ""
	@echo "📱 Фронтенд: http://localhost:5173"
	@echo "🔧 Бэкенд API: http://localhost:3000"
	@echo "🗄️  База данных: localhost:5432"
	@echo ""
	@echo "💡 Для остановки: Ctrl+C или make stop"
	@echo ""
	@trap 'kill %1 %2' INT; \
	cd backend && yarn dev & \
	cd frontend && yarn dev & \
	wait

# Остановка всех сервисов
stop:
	@echo "🛑 Останавливаем все процессы..."
	@pkill -f "yarn dev" || true
	@echo "✅ Все процессы остановлены"

# Первоначальная настройка
setup:
	@echo "📦 Настраиваем проект..."
	@if [ ! -f backend/.env ]; then \
		cp backend/env.example backend/.env; \
		echo "✅ Создан файл backend/.env"; \
	fi
	@echo "✅ Настройка завершена"

# Режим разработки (только бэкенд)
dev:
	cd backend && yarn dev

# Сборка проекта
build:
	cd backend && yarn build
	cd frontend && yarn build

# Очистка
clean:
	@echo "🧹 Очищаем node_modules..."
	rm -rf frontend/node_modules backend/node_modules
	@echo "✅ Очистка завершена"

# Настройка базы данных
db-setup:
	@echo "🗄️ Настраиваем базу данных..."
	@echo "⚠️ Убедитесь что PostgreSQL запущен на порту 5432"
	cd backend && yarn prisma db push
	@echo "✅ База данных настроена"

# Установка зависимостей
install:
	@echo "📦 Устанавливаем зависимости..."
	cd frontend && yarn install
	cd backend && yarn install
	@echo "✅ Зависимости установлены"

# Только фронтенд
frontend:
	cd frontend && yarn dev

# Только бэкенд
backend:
	cd backend && yarn dev
