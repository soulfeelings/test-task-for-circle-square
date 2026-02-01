import { prisma } from "../utils/database";
import { Round, RoundStatus } from "@prisma/client";
import { getRoundStatus } from "../utils/time";

/**
 * ВАЖНО: В продакшене этот сервис должен быть вынесен в отдельный микросервис!
 * Причины:
 * - Независимость от API серверов (не будет падать при рестарте API)
 * - Масштабируемость (один RoundManager на все реплики API)
 * - Надежность (dedicated процесс только для управления раундами)
 *
 * Архитектура:
 * - RoundManager работает как отдельный сервис
 * - API серверы подписываются на события через Redis Pub/Sub или message broker
 * - RoundManager единственный кто пишет статусы раундов в БД
 */

interface RoundTimer {
  roundId: string;
  startTimer?: NodeJS.Timeout;
  endTimer?: NodeJS.Timeout;
}

export class RoundManager {
  private static instance: RoundManager;
  private timers: Map<string, RoundTimer> = new Map();

  private constructor() {}

  static getInstance(): RoundManager {
    if (!RoundManager.instance) {
      RoundManager.instance = new RoundManager();
    }
    return RoundManager.instance;
  }

  /**
   * Инициализация: загружает активные раунды и создает таймеры
   */
  async initialize(): Promise<void> {
    console.log("[RoundManager] Initializing...");

    // Загружаем все раунды которые не завершены
    const activeRounds = await prisma.round.findMany({
      where: {
        status: {
          in: [RoundStatus.COOLDOWN, RoundStatus.ACTIVE],
        },
      },
    });

    console.log(`[RoundManager] Found ${activeRounds.length} active rounds`);

    // Для каждого раунда проверяем актуальный статус и создаем таймеры
    for (const round of activeRounds) {
      const actualStatus = getRoundStatus(round.startTime, round.endTime);

      // Если статус изменился, обновляем в БД
      if (actualStatus !== round.status) {
        console.log(
          `[RoundManager] Round ${round.id}: ${round.status} -> ${actualStatus}`
        );
        await this.updateRoundStatus(round.id, actualStatus, round.status);
        round.status = actualStatus;
      }

      // Создаем таймеры только для не завершенных раундов
      if (actualStatus !== RoundStatus.FINISHED) {
        this.scheduleRoundTimers(round);
      }
    }

    console.log("[RoundManager] Initialization complete");
  }

  /**
   * Регистрирует новый раунд и создает для него таймеры
   */
  async registerRound(round: Round): Promise<void> {
    console.log(`[RoundManager] Registering round ${round.id}`);
    this.scheduleRoundTimers(round);
  }

  /**
   * Создает таймеры для переходов статусов раунда
   */
  private scheduleRoundTimers(round: Round): void {
    const now = new Date();
    const startTime = new Date(round.startTime);
    const endTime = new Date(round.endTime);

    const timers: RoundTimer = { roundId: round.id };

    // Таймер на начало раунда (COOLDOWN -> ACTIVE)
    if (now < startTime) {
      const delayToStart = startTime.getTime() - now.getTime();
      console.log(
        `[RoundManager] Round ${round.id}: timer to ACTIVE in ${Math.floor(
          delayToStart / 1000
        )}s`
      );

      timers.startTimer = setTimeout(async () => {
        console.log(`[RoundManager] Round ${round.id}: COOLDOWN -> ACTIVE`);
        await this.updateRoundStatus(
          round.id,
          RoundStatus.ACTIVE,
          RoundStatus.COOLDOWN
        );
      }, delayToStart);
    }

    // Таймер на окончание раунда (ACTIVE -> FINISHED)
    if (now < endTime) {
      const delayToEnd = endTime.getTime() - now.getTime();
      console.log(
        `[RoundManager] Round ${round.id}: timer to FINISHED in ${Math.floor(
          delayToEnd / 1000
        )}s`
      );

      timers.endTimer = setTimeout(async () => {
        console.log(`[RoundManager] Round ${round.id}: ACTIVE -> FINISHED`);
        await this.updateRoundStatus(
          round.id,
          RoundStatus.FINISHED,
          RoundStatus.ACTIVE
        );
        this.clearTimers(round.id);
      }, delayToEnd);
    }

    this.timers.set(round.id, timers);
  }

  /**
   * Обновляет статус раунда в БД и уведомляет клиентов
   */
  private async updateRoundStatus(
    roundId: string,
    newStatus: RoundStatus,
    oldStatus: RoundStatus
  ): Promise<void> {
    try {
      const updatedRound = await prisma.round.update({
        where: { id: roundId },
        data: { status: newStatus },
      });

      console.log(
        `[RoundManager] Round ${roundId} status updated in DB: ${oldStatus} -> ${newStatus}`
      );
    } catch (error) {
      console.error(`[RoundManager] Failed to update round ${roundId}:`, error);
    }
  }

  /**
   * Очищает таймеры для раунда
   */
  private clearTimers(roundId: string): void {
    const timers = this.timers.get(roundId);
    if (timers) {
      if (timers.startTimer) clearTimeout(timers.startTimer);
      if (timers.endTimer) clearTimeout(timers.endTimer);
      this.timers.delete(roundId);
      console.log(`[RoundManager] Timers cleared for round ${roundId}`);
    }
  }

  /**
   * Получает текущее количество активных таймеров
   */
  getActiveTimersCount(): number {
    return this.timers.size;
  }

  /**
   * Очистка всех таймеров (для graceful shutdown)
   */
  shutdown(): void {
    console.log("[RoundManager] Shutting down...");
    this.timers.forEach((timers, roundId) => {
      this.clearTimers(roundId);
    });
    console.log("[RoundManager] Shutdown complete");
  }
}
