import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RoundService } from '../services/roundService.js';
import { AppDataSource } from '../data-source.js';
import { appConfig } from '../env.js';
import { AppError, ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { getRoundStatus } from '../utils/round.js';
import { UserRole } from '../entities/User.js';

const createRoundSchema = z.object({
  title: z.string().min(1).max(200).optional()
});

export async function registerRoundRoutes(app: FastifyInstance): Promise<void> {
  const roundService = new RoundService(AppDataSource);

  app.get('/api/rounds', async () => {
    const rounds = await roundService.listRounds();
    const now = new Date();
    return {
      rounds: rounds.map((round) => ({
        id: round.id,
        title: round.title,
        startsAt: round.startsAt,
        endsAt: round.endsAt,
        createdAt: round.createdAt,
        status: getRoundStatus(round, now)
      }))
    };
  });

  app.post('/api/rounds', async (request, reply) => {
    if (!request.currentUser) {
      throw new UnauthorizedError();
    }
    if (request.currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Только администратор может создавать раунды');
    }
    const payload = createRoundSchema.safeParse(request.body);
    if (!payload.success) {
      throw new AppError('Некорректные данные раунда', 400, payload.error.flatten());
    }
    const title = payload.data.title ?? null;
    const now = new Date();
    const startsAt = new Date(now.getTime() + appConfig.cooldownDurationSeconds * 1000);
    const endsAt = new Date(startsAt.getTime() + appConfig.roundDurationSeconds * 1000);

    const round = await roundService.createRound(title, startsAt, endsAt);
    reply.code(201);
    return {
      round: {
        id: round.id,
        title: round.title,
        startsAt: round.startsAt,
        endsAt: round.endsAt,
        createdAt: round.createdAt
      }
    };
  });

  app.get('/api/rounds/:roundId', async (request) => {
    const params = z.object({ roundId: z.coerce.number().int().positive() }).parse(request.params);
    const round = await roundService.getRoundOrFail(params.roundId);
    const status = getRoundStatus(round);
    const scores = await roundService.getRoundScores(round.id);

    const leaderboard = scores.map((score) => ({
      userId: score.user.id,
      username: score.user.username,
      taps: score.user.role === UserRole.NIKITA ? 0 : score.taps,
      points: score.user.role === UserRole.NIKITA ? 0 : score.points
    }));

    const sorted = [...leaderboard].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.taps !== a.taps) {
        return b.taps - a.taps;
      }
      return a.username.localeCompare(b.username);
    });

    const winner = status === 'completed' && sorted.length > 0 && sorted[0].points > 0 ? sorted[0] : null;

    const currentUserScore = request.currentUser
      ? leaderboard.find((score) => score.userId === request.currentUser?.id) ?? null
      : null;

    return {
      round: {
        id: round.id,
        title: round.title,
        startsAt: round.startsAt,
        endsAt: round.endsAt,
        createdAt: round.createdAt,
        totalPoints: round.totalPoints,
        status,
        winner
      },
      leaderboard,
      me: currentUserScore
    };
  });

  app.post('/api/rounds/:roundId/tap', async (request) => {
    if (!request.currentUser) {
      throw new UnauthorizedError();
    }
    const params = z.object({ roundId: z.coerce.number().int().positive() }).parse(request.params);
    const result = await roundService.tap(params.roundId, request.currentUser);
    return {
      taps: result.taps,
      points: result.points,
      roundPoints: result.roundPoints
    };
  });
}
