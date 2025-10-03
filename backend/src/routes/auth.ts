import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppDataSource } from '../data-source.js';
import { User, UserRole } from '../entities/User.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createAuthToken } from '../utils/token.js';
import { appConfig } from '../env.js';
import { AppError, UnauthorizedError } from '../utils/errors.js';

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(4).max(100)
});

function resolveRole(username: string): UserRole {
  const normalized = username.trim().toLowerCase();
  if (normalized === 'admin') {
    return UserRole.ADMIN;
  }
  if (normalized === 'никита' || normalized === 'nikita') {
    return UserRole.NIKITA;
  }
  return UserRole.SURVIVOR;
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/login', async (request, reply) => {
    const payload = loginSchema.safeParse(request.body);
    if (!payload.success) {
      throw new AppError('Некорректные учетные данные', 400, payload.error.flatten());
    }

    const { username, password } = payload.data;
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({ where: { username } });

    if (!user) {
      const passwordHash = await hashPassword(password);
      user = userRepository.create({
        username,
        passwordHash,
        role: resolveRole(username)
      });
      user = await userRepository.save(user);
    } else {
      const passwordMatches = await verifyPassword(password, user.passwordHash);
      if (!passwordMatches) {
        throw new UnauthorizedError('Неверное имя пользователя или пароль');
      }
      const updatedRole = resolveRole(user.username);
      if (user.role !== updatedRole) {
        user.role = updatedRole;
        await userRepository.save(user);
      }
    }

    const token = createAuthToken({ userId: user.id });
    reply.setCookie(appConfig.cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    reply.clearCookie(appConfig.cookieName, { path: '/' });
    return { success: true };
  });

  app.get('/api/auth/me', async (request) => {
    if (!request.currentUser) {
      throw new UnauthorizedError();
    }
    const { id, username, role } = request.currentUser;
    return { user: { id, username, role } };
  });
}
