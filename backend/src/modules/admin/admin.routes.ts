import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../middleware/admin';
import {
  getSummary,
  getSubscriptions,
  getActiveUsers,
  getUsers,
  getTokenUsage,
} from './admin.controller';

export async function adminRoutes(server: FastifyInstance) {
  server.addHook('preHandler', requireAdmin);

  server.get('/summary', getSummary);
  server.get('/subscriptions', getSubscriptions);
  server.get('/active-users', getActiveUsers);
  server.get('/users', getUsers);
  server.get('/token-usage', getTokenUsage);
}
