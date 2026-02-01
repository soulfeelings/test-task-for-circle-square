import { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../services/UserService";
import type { User } from "@prisma/client";

// Расширяем типы Fastify для добавления пользователя в request
declare module "fastify" {
  interface FastifyRequest {
    user?: User;
  }
}

/**
 * Middleware для аутентификации пользователя
 * В реальном приложении здесь была бы проверка JWT токена
 * Для простоты используем username из query параметров
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const username =
      (request.query as any)?.username ||
      (request.headers as any)["x-username"];

    if (!username) {
      return reply.status(401).send({ error: "Username is required" });
    }

    // Получаем или создаем пользователя
    const user = await UserService.createUser(username);
    request.user = user;
  } catch (error) {
    return reply.status(401).send({ error: "Authentication failed" });
  }
}

/**
 * Middleware для проверки роли админа
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({ error: "Authentication required" });
  }

  if (!UserService.isAdmin(request.user)) {
    return reply.status(403).send({ error: "Admin access required" });
  }
}
