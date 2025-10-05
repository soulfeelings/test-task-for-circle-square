import { prisma } from '../utils/database';
import { User, UserRole } from '@prisma/client';

export class UserService {
  /**
   * Создает пользователя с автоматическим определением роли
   */
  static async createUser(username: string): Promise<User> {
    const role = this.determineUserRole(username);
    
    return prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        role,
      },
    });
  }

  /**
   * Получает пользователя по username
   */
  static async getUserByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Получает пользователя по ID
   */
  static async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Определяет роль пользователя на основе имени
   */
  static determineUserRole(username: string): UserRole {
    const lowerUsername = username.toLowerCase();
    
    if (lowerUsername === 'admin') {
      return UserRole.ADMIN;
    } else if (lowerUsername === 'никита' || lowerUsername === 'nikita') {
      return UserRole.NIKITA;
    } else {
      return UserRole.SURVIVOR;
    }
  }

  /**
   * Проверяет, является ли пользователь админом
   */
  static isAdmin(user: User): boolean {
    return user.role === UserRole.ADMIN;
  }

  /**
   * Проверяет, является ли пользователь Никитой
   */
  static isNikita(user: User): boolean {
    return user.role === UserRole.NIKITA;
  }

  /**
   * Получает всех пользователей
   */
  static async getAllUsers(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }
}
