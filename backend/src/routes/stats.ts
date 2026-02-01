import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { TapService } from "../services/TapService";
import { authMiddleware } from "../middleware/auth";
import { RoundParams, RoundStatsResponse } from "../types";

export async function statsRoutes(fastify: FastifyInstance) {
  // Получить статистику раунда
  fastify.get<{
    Params: RoundParams;
    Reply: RoundStatsResponse;
  }>(
    "/rounds/:id/stats",
    {
      preHandler: [authMiddleware],
    },
    async (
      request: FastifyRequest<{ Params: RoundParams }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { id } = request.params as RoundParams;
        const stats = await TapService.getRoundStats(id);
        await reply.send(stats);
      } catch (error) {
        if (error instanceof Error && error.message === "Round not found") {
          await reply.status(404).send({ error: "Round not found" });
          return;
        }
        await reply.status(500).send({ error: "Failed to fetch round stats" });
      }
    }
  );
}
