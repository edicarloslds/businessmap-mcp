import { Server } from 'node:http';
import { startHttpServer } from './http.js';
import { config } from '../config/environment.js';

describe('HTTP Server Middleware Order', () => {
  let server: Server;
  const testPort = 3099;

  beforeAll(() => {
    // Set required config parameters dynamically
    config.server.port = testPort;
    config.server.allowedOrigins = ['http://localhost:8080'];
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('runs CORS before custom middlewares so that preflight OPTIONS requests bypass auth', async () => {
    // Custom auth middleware that rejects everything with 401
    const authMiddleware = (req: any, res: any, next: any) => {
      res.status(401).json({ error: 'Unauthorized' });
    };

    server = await startHttpServer({
      middlewares: [authMiddleware],
    });

    // 1. Perform preflight OPTIONS request
    const preflightRes = await fetch(`http://localhost:${testPort}/mcp`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8080',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,mcp-session-id',
      },
    });

    expect(preflightRes.status).toBe(204); // CORS preflight default success is 204
    expect(preflightRes.headers.get('access-control-allow-origin')).toBe('http://localhost:8080');

    // 2. Perform actual POST request which should be intercepted and rejected with 401 by auth middleware
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
