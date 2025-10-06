import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { RoundService } from "../services/RoundService";
import { RoundManager } from "../services/RoundManager";
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

        // Регистрируем раунд в RoundManager для управления таймерами
        const roundManager = RoundManager.getInstance();
        await roundManager.registerRound(round);

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
}
