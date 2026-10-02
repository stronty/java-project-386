import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';

export interface AppOptions {
  staticDir?: string;
}

export function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: false });

  app.get('/health', async () => ({ status: 'ok' }));

  if (options.staticDir && existsSync(options.staticDir)) {
    app.register(fastifyStatic, { root: options.staticDir });
    app.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api')) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ message: 'Not found' });
    });
  }

  return app;
}
