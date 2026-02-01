import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { TapService } from "../services/TapService";
import { authMiddleware } from "../middleware/auth";
import { z } from "zod";
import {
  TapRequest,
  TapResponse,
  TapParams,
  UserStatsResponse,
  Tap,
} from "../types";

// Схема валидации для запроса тапа
const tapRequestSchema = z.object({
  roundId: z.string().min(1),
});

// Схема валидации для batch тапов
const batchTapRequestSchema = z.object({
  roundId: z.string().min(1),
  count: z.number().min(1).max(1000),
});

export async function tapsRoutes(fastify: FastifyInstance) {
  // Обработать тап
  fastify.post<{
    Body: TapRequest;
    Reply: TapResponse;
  }>(
    "/taps",
    {
      preHandler: [authMiddleware],
      schema: {
        body: {
          type: "object",
          required: ["roundId"],
          properties: {
            roundId: { type: "string" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: TapRequest }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { roundId } = tapRequestSchema.parse(request.body);

        if (!request.user) {
          await reply.status(401).send({ error: "User not authenticated" });
          return;
        }

        const result = await TapService.processTap(request.user.id, roundId);
        await reply.send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          await reply.status(400).send({
            error: "Invalid request data",
            details: error.errors,
          });
          return;
        }

        if (error instanceof Error) {
          if (
            error.message === "User not found" ||
            error.message === "Round not found"
          ) {
            await reply.status(404).send({ error: error.message });
            return;
          }
        }

        await reply.status(500).send({ error: "Failed to process tap" });
      }
    }
  );

  // Обработать batch тапов
  fastify.post<{
    Body: { roundId: string; count: number };
    Reply: TapResponse;
  }>(
    "/taps/batch",
    {
      preHandler: [authMiddleware],
      schema: {
        body: {
          type: "object",
          required: ["roundId", "count"],
          properties: {
            roundId: { type: "string" },
            count: { type: "number", minimum: 1, maximum: 1000 },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { roundId: string; count: number } }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { roundId, count } = batchTapRequestSchema.parse(request.body);

        if (!request.user) {
          await reply.status(401).send({ error: "User not authenticated" });
          return;
        }

        const result = await TapService.processBatchTaps(request.user.id, roundId, count);
        await reply.send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          await reply.status(400).send({
            error: "Invalid request data",
            details: error.errors,
          });
          return;
        }

        if (error instanceof Error) {
          if (
            error.message === "User not found" ||
            error.message === "Round not found"
          ) {
            await reply.status(404).send({ error: error.message });
            return;
          }
        }

        await reply.status(500).send({ error: "Failed to process batch taps" });
      }
    }
  );

  // Получить статистику пользователя для раунда
  fastify.get<{
    Params: TapParams;
    Reply: UserStatsResponse;
  }>(
    "/taps/stats/:roundId",
    {
      preHandler: [authMiddleware],
    },
    async (
      request: FastifyRequest<{ Params: TapParams }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { roundId } = request.params as TapParams;

        if (!request.user) {
          await reply.status(401).send({ error: "User not authenticated" });
          return;
        }

        const stats = await TapService.getUserRoundStats(
          request.user.id,
          roundId
        );
        await reply.send(stats);
      } catch (error) {
        await reply.status(500).send({ error: "Failed to fetch user stats" });
      }
    }
  );

  // Получить тапы пользователя для раунда
  fastify.get<{
    Params: TapParams;
    Reply: Tap[];
  }>(
    "/taps/user/:roundId",
    {
      preHandler: [authMiddleware],
    },
    async (
      request: FastifyRequest<{ Params: TapParams }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { roundId } = request.params as TapParams;

        if (!request.user) {
          await reply.status(401).send({ error: "User not authenticated" });
          return;
        }

        const taps = await TapService.getUserTapsForRound(
          request.user.id,
          roundId
        );
        await reply.send(taps);
      } catch (error) {
        await reply.status(500).send({ error: "Failed to fetch user taps" });
      }
    }
  );
}
