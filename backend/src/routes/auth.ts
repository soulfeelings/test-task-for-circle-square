import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../services/UserService";
import { authMiddleware } from "../middleware/auth";
import { User, CreateUserRequest } from "../types";

export async function authRoutes(fastify: FastifyInstance) {
  // Логин пользователя
  fastify.post<{
    Body: { username: string };
    Reply: User;
  }>(
    "/login",
    async (
      request: FastifyRequest<{ Body: { username: string } }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { username } = request.body;

        if (!username) {
          await reply.status(400).send({ error: "Username is required" });
          return;
        }

        const user = await UserService.createUser(username);
        await reply.send(user);
      } catch (error) {
        await reply.status(500).send({ error: "Failed to login" });
      }
    }
  );

  // Получить текущего пользователя
  fastify.get<{
    Reply: User;
  }>(
    "/me",
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        if (!request.user) {
          await reply.status(401).send({ error: "User not authenticated" });
          return;
        }

        await reply.send(request.user);
      } catch (error) {
        await reply.status(500).send({ error: "Failed to fetch user info" });
      }
    }
  );

  // Создать пользователя (для тестирования)
  fastify.post<{
    Body: CreateUserRequest;
    Reply: User;
  }>(
    "/users",
    async (
      request: FastifyRequest<{ Body: CreateUserRequest }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { username } = request.body as CreateUserRequest;

        if (!username) {
          await reply.status(400).send({ error: "Username is required" });
          return;
        }

        const user = await UserService.createUser(username);
        await reply.status(201).send(user);
      } catch (error) {
        await reply.status(500).send({ error: "Failed to create user" });
      }
    }
  );

  // Получить всех пользователей (для админов)
  fastify.get<{
    Reply: User[];
  }>(
    "/users",
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        if (!request.user) {
          await reply.status(401).send({ error: "User not authenticated" });
          return;
        }

        // В реальном приложении здесь была бы проверка на админа
        const users = await UserService.getAllUsers();
        await reply.send(users);
      } catch (error) {
        await reply.status(500).send({ error: "Failed to fetch users" });
      }
    }
  );
}
