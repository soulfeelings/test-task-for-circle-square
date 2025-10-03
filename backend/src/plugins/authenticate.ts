import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import { verifyAuthToken } from '../utils/token.js';
import { AppDataSource } from '../data-source.js';
import { User } from '../entities/User.js';
import { UnauthorizedError } from '../utils/errors.js';
import { appConfig } from '../env.js';

export async function registerAuthPlugin(app: FastifyInstance): Promise<void> {
  await app.register(cookie, {
    secret: appConfig.jwtSecret,
    parseOptions: {
      httpOnly: true,
      sameSite: 'lax'
    }
  });

  app.decorate(
    'authenticate',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      if (!request.currentUser) {
        throw new UnauthorizedError();
      }
    }
  );

  app.addHook('preHandler', async (request) => {
    request.currentUser = undefined;
    const token = request.cookies?.[appConfig.cookieName];
    if (!token) {
      return;
    }
    try {
      const payload = verifyAuthToken(token);
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOneBy({ id: payload.userId });
      if (user) {
        request.currentUser = user;
      }
    } catch {
      request.currentUser = undefined;
    }
  });
}
