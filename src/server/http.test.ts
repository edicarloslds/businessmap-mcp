import type { Server } from 'node:http';
import type { RequestHandler } from 'express';

type StartHttpServer = typeof import('./http.js').startHttpServer;
type EnvironmentConfig = typeof import('../config/environment.js').config;

let startHttpServer: StartHttpServer;
let config: EnvironmentConfig;

describe('HTTP Server Middleware Order', () => {
  let server: Server | undefined;
  const testPort = 3099;

  beforeAll(async () => {
    process.env.BUSINESSMAP_API_URL ??= 'https://example.businessmap.io';
    process.env.BUSINESSMAP_API_TOKEN ??= 'test-token';

    ({ startHttpServer } = await import('./http.js'));
    ({ config } = await import('../config/environment.js'));

    config.server.port = testPort;
    config.server.allowedOrigins = ['http://localhost:8080'];
  });

  afterEach(async () => {
    if (!server) {
      return;
    }

    if ('closeAllConnections' in server && typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }

    const activeServer = server;
    await new Promise<void>((resolve, reject) => {
      activeServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    server = undefined;
  });

  it('runs CORS before custom middlewares so that preflight OPTIONS requests bypass auth', async () => {
    const authMiddleware: RequestHandler = (_req, res) => {
      res.status(401).json({ error: 'Unauthorized' });
    };

    server = await startHttpServer({
      middlewares: [authMiddleware],
    });

    const preflightRes = await fetch(`http://localhost:${testPort}/mcp`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:8080',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,mcp-session-id',
      },
    });

    expect(preflightRes.status).toBe(204);
    expect(preflightRes.headers.get('access-control-allow-origin')).toBe('http://localhost:8080');

    const postRes = await fetch(`http://localhost:${testPort}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });

    expect(postRes.status).toBe(401);
    const body = await postRes.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });
});
