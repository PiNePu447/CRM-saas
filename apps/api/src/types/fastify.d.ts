import 'fastify';
import { CurrentUserData } from '../common/decorators/current-user.decorator';

declare module 'fastify' {
  interface FastifyRequest {
    user?: CurrentUserData;
  }
}
