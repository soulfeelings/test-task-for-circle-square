import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { RoundService } from "../services/RoundService";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { Round, RoundParams } from "../types";

export async function roundsRoutes(fastify: FastifyInstance) {
  // Получить все раунды
  fastify.get<{
    Reply: Round[];
  }>(
    "/rounds",
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const rounds = await RoundService.getAllRounds();
        await reply.send(rounds);
      } catch (error) {
        await reply.status(500).send({ error: "Failed to fetch rounds" });
      }
    }
  );

  // Создать новый раунд (только для админов)
  fastify.post<{
    Reply: Round;
  }>(
    "/rounds",
    {
      preHandler: [authMiddleware, adminMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const cooldownDuration = parseInt(
          process.env.COOLDOWN_DURATION || "30"
        );
        const roundDuration = parseInt(process.env.ROUND_DURATION || "60");

        const round = await RoundService.createRound(
          cooldownDuration,
          roundDuration
        );
        await reply.status(201).send(round);
      } catch (error) {
        await reply.status(500).send({ error: "Failed to create round" });
      }
    }
  );

  // Получить раунд по ID
  fastify.get<{
    Params: RoundParams;
    Reply: Round;
  }>(
    "/rounds/:id",
    async (
      request: FastifyRequest<{ Params: RoundParams }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { id } = request.params as RoundParams;
        const round = await RoundService.getRoundById(id);

        if (!round) {
          await reply.status(404).send({ error: "Round not found" });
          return;
        }

        await reply.send(round);
      } catch (error) {
        await reply.status(500).send({ error: "Failed to fetch round" });
      }
    }
  );

  // Получить активный раунд
  fastify.get<{
    Reply: Round | null;
  }>(
    "/rounds/active",
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const activeRound = await RoundService.getActiveRound();
        await reply.send(activeRound);
      } catch (error) {
        await reply.status(500).send({ error: "Failed to fetch active round" });
      }
    }
  );

  // Обновить статус раунда
  fastify.patch<{
    Params: RoundParams;
    Reply: Round;
  }>(
    "/rounds/:id/status",
    {
      preHandler: [authMiddleware, adminMiddleware],
    },
    async (
      request: FastifyRequest<{ Params: RoundParams }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { id } = request.params as RoundParams;
        const updatedRound = await RoundService.updateRoundStatus(id);
        await reply.send(updatedRound);
      } catch (error) {
        if (error instanceof Error && error.message === "Round not found") {
          await reply.status(404).send({ error: "Round not found" });
          return;
        }
        await reply
          .status(500)
          .send({ error: "Failed to update round status" });
      }
    }
  );

  // Long polling для получения обновлений раунда
  fastify.get<{
    Params: RoundParams;
    Reply: Round;
  }>(
    "/rounds/:id/poll",
    {
      preHandler: [authMiddleware],
    },
    async (
      request: FastifyRequest<{ Params: RoundParams }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { id } = request.params as RoundParams;

        // Ждем изменения статуса раунда (максимум 30 секунд)
        const updatedRound = await RoundService.waitForRoundUpdate(id, 30000);

        if (!updatedRound) {
          await reply.status(404).send({ error: "Round not found" });
          return;
        }

        await reply.send(updatedRound);
      } catch (error) {
        if (error instanceof Error && error.message === "Round not found") {
          await reply.status(404).send({ error: "Round not found" });
          return;
        }
        if (error instanceof Error && error.message === "Timeout") {
          await reply.status(408).send({ error: "Request timeout" });
          return;
        }
        await reply.status(500).send({ error: "Failed to poll round updates" });
      }
    }
  );
}
