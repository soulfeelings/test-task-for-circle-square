import { prisma } from "../utils/database";
import type { User, Round, UserRoundStats, Tap, Prisma } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { calculatePointsForUser } from "../utils/score";
import { TapResult, RoundStatsResponse, UserStatsResponse } from "../types";

export class TapService {
  /**
   * Обрабатывает тап пользователя с обеспечением консистентности данных
   */
  static async processTap(userId: string, roundId: string): Promise<TapResult> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Проверяем существование пользователя и раунда
      const [user, round] = await Promise.all([
        tx.user.findUnique({ where: { id: userId } }),
        tx.round.findUnique({ where: { id: roundId } }),
      ]);

      if (!user) {
        throw new Error("User not found");
      }

      if (!round) {
        throw new Error("Round not found");
      }

      // 2. Проверяем, что раунд активен
      const now = new Date();
      if (now < round.startTime || now > round.endTime) {
        return {
          success: false,
          points: 0,
          totalPoints: 0,
          message: "Round is not active",
        };
      }

      // 3. Получаем или создаем статистику пользователя для раунда
      let userStats = await tx.userRoundStats.findUnique({
        where: {
          userId_roundId: {
            userId,
            roundId,
          },
        },
      });

      if (!userStats) {
        userStats = await tx.userRoundStats.create({
          data: {
            userId,
            roundId,
            taps: 0,
            points: 0,
          },
        });
      }

      // 4. Увеличиваем счетчик тапов
      const newTapCount = userStats.taps + 1;
      const tapPoints = calculatePointsForUser(newTapCount, user.role);

      // 5. Обновляем статистику пользователя
      const updatedStats = await tx.userRoundStats.update({
        where: {
          userId_roundId: {
            userId,
            roundId,
          },
        },
        data: {
          taps: newTapCount,
          points: userStats.points + tapPoints,
        },
      });

      // 6. Создаем запись о тапе
      await tx.tap.create({
        data: {
          userId,
          roundId,
          points: tapPoints,
        },
      });

      // 7. Формируем ответ
      const result: TapResult = {
        success: true,
        points: tapPoints,
        totalPoints: updatedStats.points,
      };

      // Добавляем сообщение для Никиты
      if (user.role === UserRole.NIKITA) {
        result.message = "Никита не получает очков!";
      }

      return result;
    });
  }

  /**
   * Обрабатывает batch тапов пользователя
   */
  static async processBatchTaps(userId: string, roundId: string, count: number): Promise<TapResult> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Проверяем существование пользователя и раунда
      const [user, round] = await Promise.all([
        tx.user.findUnique({ where: { id: userId } }),
        tx.round.findUnique({ where: { id: roundId } }),
      ]);

      if (!user) {
        throw new Error("User not found");
      }

      if (!round) {
        throw new Error("Round not found");
      }

      // 2. Проверяем, что раунд активен
      const now = new Date();
      if (now < round.startTime || now > round.endTime) {
        return {
          success: false,
          points: 0,
          totalPoints: 0,
          message: "Round is not active",
        };
      }

      // 3. Получаем или создаем статистику пользователя для раунда
      let userStats = await tx.userRoundStats.findUnique({
        where: {
          userId_roundId: {
            userId,
            roundId,
          },
        },
      });

      if (!userStats) {
        userStats = await tx.userRoundStats.create({
          data: {
            userId,
            roundId,
            taps: 0,
            points: 0,
          },
        });
      }

      // 4. Обрабатываем все тапы
      let totalBatchPoints = 0;
      const currentTaps = userStats.taps;

      for (let i = 1; i <= count; i++) {
        const tapNumber = currentTaps + i;
        const tapPoints = calculatePointsForUser(tapNumber, user.role);
        totalBatchPoints += tapPoints;

        // Создаем запись о каждом тапе
        await tx.tap.create({
          data: {
            userId,
            roundId,
            points: tapPoints,
          },
        });
      }

      // 5. Обновляем статистику пользователя
      const updatedStats = await tx.userRoundStats.update({
        where: {
          userId_roundId: {
            userId,
            roundId,
          },
        },
        data: {
          taps: currentTaps + count,
          points: userStats.points + totalBatchPoints,
        },
      });

      // 6. Формируем ответ
      const result: TapResult = {
        success: true,
        points: totalBatchPoints,
        totalPoints: updatedStats.points,
      };

      // Добавляем сообщение для Никиты
      if (user.role === UserRole.NIKITA) {
        result.message = "Никита не получает очков!";
      }

      return result;
    });
  }

  /**
   * Получает статистику пользователя для раунда
   */
  static async getUserRoundStats(
    userId: string,
    roundId: string
  ): Promise<UserStatsResponse> {
    const stats = await prisma.userRoundStats.findUnique({
      where: {
        userId_roundId: {
          userId,
          roundId,
        },
      },
    });

    return {
      taps: stats?.taps || 0,
      points: stats?.points || 0,
    };
  }

  /**
   * Получает все тапы пользователя для раунда
   */
  static async getUserTapsForRound(
    userId: string,
    roundId: string
  ): Promise<Tap[]> {
    return prisma.tap.findMany({
      where: {
        userId,
        roundId,
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  }

  /**
   * Получает общую статистику раунда
   */
  static async getRoundStats(roundId: string): Promise<RoundStatsResponse> {
    const [round, userStats, totalTaps] = await Promise.all([
      prisma.round.findUnique({ where: { id: roundId } }),
      prisma.userRoundStats.findMany({
        where: { roundId },
        include: { user: true },
        orderBy: { points: "desc" },
      }),
      prisma.tap.aggregate({
        where: { roundId },
        _count: { id: true },
        _sum: { points: true },
      }),
    ]);

    if (!round) {
      throw new Error("Round not found");
    }

    const totalPoints = totalTaps._sum.points || 0;
    const winner = userStats.length > 0 ? userStats[0] : null;

    return {
      roundId,
      totalTaps: totalTaps._count.id,
      totalPoints,
      winner: winner
        ? {
            username: winner.user.username,
            points: winner.points,
          }
        : undefined,
      userStats: userStats.map((stat: any) => ({
        username: stat.user.username,
        taps: stat.taps,
        points: stat.points,
      })),
    };
  }
}
