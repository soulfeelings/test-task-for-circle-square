import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { prisma } from "./utils/database";
import { RoundService } from "./services/RoundService";
import { HealthCheckResponse } from "./types";

// Импорт маршрутов
import { roundsRoutes } from "./routes/rounds";
import { tapsRoutes } from "./routes/taps";
import { statsRoutes } from "./routes/stats";
import { authRoutes } from "./routes/auth";

// Создание экземпляра Fastify
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "development" ? "info" : "warn",
  },
});

// Регистрация плагинов
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: true, // В продакшене указать конкретные домены
    credentials: true,
  });

  // WebSocket
  await fastify.register(websocket);
}

// Регистрация маршрутов
async function registerRoutes() {
  // API маршруты
  await fastify.register(roundsRoutes, { prefix: "/api" });
  await fastify.register(tapsRoutes, { prefix: "/api" });
  await fastify.register(statsRoutes, { prefix: "/api" });
  await fastify.register(authRoutes, { prefix: "/api" });

  // WebSocket для real-time обновлений
  fastify.register(
    async function (fastify) {
      fastify.get("/ws", { websocket: true }, (connection, req) => {
        console.log("WebSocket connection established");

        connection.socket.on("message", (message: any) => {
          try {
            const data = JSON.parse(message.toString());
            console.log("Received WebSocket message:", data);

            // Здесь можно обрабатывать входящие сообщения
            connection.socket.send(
              JSON.stringify({
                type: "ack",
                data: { received: true },
              })
            );
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        });

        connection.socket.on("close", () => {
          console.log("WebSocket connection closed");
        });
      });
    },
    { prefix: "/api" }
  );

  // Health check
  fastify.get<{
    Reply: HealthCheckResponse;
  }>("/health", async (request, reply) => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });
}

// Функция для периодического обновления статусов раундов
function startRoundStatusUpdater() {
  setInterval(async () => {
    try {
      await RoundService.updateAllRoundStatuses();
    } catch (error) {
      console.error("Error updating round statuses:", error);
    }
  }, 5000); // Обновляем каждые 5 секунд
}

// Запуск сервера
async function start() {
  try {
    // Подключение к базе данных
    await prisma.$connect();
    console.log("Connected to database");

    // Регистрация плагинов и маршрутов
    await registerPlugins();
    await registerRoutes();

    // Запуск обновления статусов раундов
    startRoundStatusUpdater();

    // Запуск сервера
    const port = parseInt(process.env.PORT || "3000");
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down server...");
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

// Запуск
start();
