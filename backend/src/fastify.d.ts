import 'fastify';
import { User } from './entities/User.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: () => Promise<void>;
  }

  interface FastifyRequest {
    currentUser?: User;
  }
}
