import { UserRole } from '@prisma/client';

/**
 * Вычисляет очки за тап
 * Каждый 11-й тап дает 10 очков, остальные - 1 очко
 */
export function calculateTapPoints(tapCount: number): number {
  return tapCount % 11 === 0 ? 10 : 1;
}

/**
 * Вычисляет очки с учетом роли пользователя
 * Никита всегда получает 0 очков
 */
export function calculatePointsForUser(tapCount: number, userRole: UserRole): number {
  if (userRole === UserRole.NIKITA) {
    return 0;
  }
  return calculateTapPoints(tapCount);
}

/**
 * Проверяет, должен ли пользователь получать очки
 */
export function shouldUserGetPoints(userRole: UserRole): boolean {
  return userRole !== UserRole.NIKITA;
}
