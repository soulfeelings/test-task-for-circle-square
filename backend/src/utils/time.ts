import { RoundStatus } from '@prisma/client';

/**
 * Определяет статус раунда на основе текущего времени
 */
export function getRoundStatus(startTime: Date, endTime: Date): RoundStatus {
  const now = new Date();
  
  if (now < startTime) {
    return RoundStatus.COOLDOWN;
  } else if (now >= startTime && now <= endTime) {
    return RoundStatus.ACTIVE;
  } else {
    return RoundStatus.FINISHED;
  }
}

/**
 * Вычисляет время до начала раунда (cooldown)
 */
export function getTimeToStart(startTime: Date): number {
  const now = new Date();
  const diff = startTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Вычисляет время до окончания раунда
 */
export function getTimeToEnd(endTime: Date): number {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Проверяет, активен ли раунд сейчас
 */
export function isRoundActive(startTime: Date, endTime: Date): boolean {
  const now = new Date();
  return now >= startTime && now <= endTime;
}

/**
 * Создает даты для нового раунда
 */
export function createRoundDates(cooldownDuration: number, roundDuration: number) {
  const now = new Date();
  const startTime = new Date(now.getTime() + cooldownDuration * 1000);
  const endTime = new Date(startTime.getTime() + roundDuration * 1000);
  
  return { startTime, endTime };
}
