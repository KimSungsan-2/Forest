import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { config } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import { reflectionRoutes, chatRoutes } from './modules/reflections/reflection.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { paymentRoutes } from './modules/payments/payment.routes';

const server = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'error',
    transport:
      config.nodeEnv === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

async function start() {
  try {
    // Security plugins
    await server.register(helmet, {
      contentSecurityPolicy: config.nodeEnv === 'production',
    });

    await server.register(cors, {
      origin: config.allowedOrigins,
      credentials: true,
    });

    await server.register(rateLimit, {
      max: config.rateLimitMax,
      timeWindow: config.rateLimitTimeWindow,
    });

    // JWT authentication
    await server.register(jwt, {
      secret: config.jwtSecret,
    });

    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Routes
    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(reflectionRoutes, { prefix: '/api/reflections' });
    await server.register(chatRoutes, { prefix: '/api/chat' });
    await server.register(analyticsRoutes, { prefix: '/api/analytics' });
    await server.register(paymentRoutes, { prefix: '/api/payments' });

    // Start server
    await server.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    console.log(`🌲 Forest of Calm Backend running on http://localhost:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
