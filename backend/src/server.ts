import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { registerAuthPlugin } from './plugins/authenticate.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerRoundRoutes } from './routes/rounds.js';
import { appConfig } from './env.js';
import { AppError } from './utils/errors.js';

export async function buildServer(): Promise<FastifyInstance> {
  const app = fastify({ logger: true });

  await app.register(cors, {
    origin: appConfig.corsOrigin === '*' ? true : [appConfig.corsOrigin],
    credentials: true
  });

  await registerAuthPlugin(app);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn({ err: error }, 'Handled application error');
      reply.status(error.statusCode).send({ message: error.message, details: error.details ?? null });
      return;
    }

    request.log.error({ err: error }, 'Unexpected error');
    reply.status(500).send({ message: 'Внутренняя ошибка сервера' });
  });

  await registerAuthRoutes(app);
  await registerRoundRoutes(app);

  return app;
}
