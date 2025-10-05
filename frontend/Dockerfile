# Многоэтапная сборка для оптимизации размера
FROM node:20-alpine AS base

# Рабочая директория
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json yarn.lock ./

# Установка зависимостей
RUN yarn install --frozen-lockfile

# Этап разработки
FROM base AS development
COPY . .
EXPOSE 5173
CMD ["yarn", "dev", "--host", "0.0.0.0"]

# Этап сборки
FROM base AS build
COPY . .
RUN yarn build

# Продакшн этап с nginx
FROM nginx:alpine AS production

# Копируем собранные файлы
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
