import { prisma } from "../utils/database";
import { Round, RoundStatus } from "@prisma/client";
import { createRoundDates, getRoundStatus } from "../utils/time";

export class RoundService {
  /**
   * Создает новый раунд
   */
  static async createRound(
    cooldownDuration: number,
    roundDuration: number
  ): Promise<Round> {
    const { startTime, endTime } = createRoundDates(
      cooldownDuration,
      roundDuration
    );

    return prisma.round.create({
      data: {
        startTime,
        endTime,
        status: RoundStatus.COOLDOWN,
      },
    });
  }

  /**
   * Получает все раунды
   */
  static async getAllRounds(): Promise<Round[]> {
    return prisma.round.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Получает раунд по ID
   */
  static async getRoundById(id: string): Promise<Round | null> {
    return prisma.round.findUnique({
      where: { id },
    });
  }

  /**
   * Получает активный раунд
   */
  static async getActiveRound(): Promise<Round | null> {
    const now = new Date();

    return prisma.round.findFirst({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
        status: RoundStatus.ACTIVE,
      },
    });
  }

  /**
   * Обновляет статус раунда на основе текущего времени
   */
  static async updateRoundStatus(roundId: string): Promise<Round> {
    const round = await this.getRoundById(roundId);
    if (!round) {
      throw new Error("Round not found");
    }

    const newStatus = getRoundStatus(round.startTime, round.endTime);

    return prisma.round.update({
      where: { id: roundId },
      data: { status: newStatus },
    });
  }

  /**
   * Обновляет статусы всех раундов
   */
  static async updateAllRoundStatuses(): Promise<void> {
    const rounds = await prisma.round.findMany({
      where: {
        status: { in: [RoundStatus.COOLDOWN, RoundStatus.ACTIVE] },
      },
    });

    for (const round of rounds) {
      const newStatus = getRoundStatus(round.startTime, round.endTime);
      if (newStatus !== round.status) {
        await prisma.round.update({
          where: { id: round.id },
          data: { status: newStatus },
        });
      }
    }
  }

  /**
   * Проверяет, активен ли раунд
   */
  static async isRoundActive(roundId: string): Promise<boolean> {
    const round = await this.getRoundById(roundId);
    if (!round) {
      return false;
    }

    const now = new Date();
    return now >= round.startTime && now <= round.endTime;
  }

  /**
   * Получает последний раунд
   */
  static async getLatestRound(): Promise<Round | null> {
    return prisma.round.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Ждет изменения статуса раунда (для long polling)
   */
  static async waitForRoundUpdate(
    roundId: string,
    timeoutMs: number = 30000
  ): Promise<Round | null> {
    const startTime = Date.now();
    const checkInterval = 1000; // Проверяем каждую секунду

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const round = await prisma.round.findUnique({
            where: { id: roundId },
          });

          if (!round) {
            reject(new Error("Round not found"));
            return;
          }

          // Проверяем, изменился ли статус раунда
          const currentStatus = getRoundStatus(round.startTime, round.endTime);
          if (currentStatus !== round.status) {
            // Обновляем статус в базе
            const updatedRound = await prisma.round.update({
              where: { id: roundId },
              data: { status: currentStatus },
            });
            resolve(updatedRound);
            return;
          }

          // Проверяем таймаут
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error("Timeout"));
            return;
          }

          // Продолжаем ждать
          setTimeout(checkStatus, checkInterval);
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }
}
