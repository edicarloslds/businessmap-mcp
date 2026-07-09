import type { RequestHandler } from 'express';
import type { ManagedHttpServer } from './http.js';

type StartHttpServer = typeof import('./http.js').startHttpServer;
type EnvironmentConfig = typeof import('../config/environment.js').config;

let startHttpServer: StartHttpServer;
let config: EnvironmentConfig;

describe('HTTP server', () => {
  let server: ManagedHttpServer | undefined;
  const testPort = 3099;

  beforeAll(async () => {
    process.env.BUSINESSMAP_API_URL ??= 'https://example.businessmap.io';
    process.env.BUSINESSMAP_API_TOKEN ??= 'test-token';

    ({ startHttpServer } = await import('./http.js'));
    ({ config } = await import('../config/environment.js'));

    config.server.port = testPort;
    config.server.allowedOrigins = ['http://localhost:8080'];
    config.server.allowedHosts = [`localhost:${testPort}`];
  });

  afterEach(async () => {
    if (!server) {
      return;
    }

    await server.shutdown();
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
        Connection: 'close',
      },
    });

    expect(preflightRes.status).toBe(204);
    expect(preflightRes.headers.get('access-control-allow-origin')).toBe('http://localhost:8080');

    const postRes = await fetch(`http://localhost:${testPort}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Connection: 'close',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });

    expect(postRes.status).toBe(401);
    const body = await postRes.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('enforces the configured JSON body limit', async () => {
    server = await startHttpServer({ bodyLimit: '100b' });

    const response = await fetch(`http://localhost:${testPort}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ value: 'x'.repeat(200) }),
    });

    expect(response.status).toBe(413);
  });

  it('reports liveness and readiness separately', async () => {
    server = await startHttpServer();

    const [health, readiness] = await Promise.all([
      fetch(`http://localhost:${testPort}/health`, { headers: { Connection: 'close' } }),
      fetch(`http://localhost:${testPort}/ready`, { headers: { Connection: 'close' } }),
    ]);

    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ status: 'ok' });
    expect(readiness.status).toBe(200);
    expect(await readiness.json()).toMatchObject({ status: 'ready' });
  });

  it('rejects new sessions when session capacity is reached', async () => {
    server = await startHttpServer({ maxSessions: 1 });
    const initializeRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'http-test', version: '1.0.0' },
      },
    };
    const headers = {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
      Connection: 'close',
    };

    const first = await fetch(`http://localhost:${testPort}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(initializeRequest),
    });
    expect(first.status).toBe(200);
    expect(first.headers.get('mcp-session-id')).toBeTruthy();

    const second = await fetch(`http://localhost:${testPort}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(initializeRequest),
    });
    expect(second.status).toBe(503);
    expect(await second.json()).toEqual({ error: 'HTTP session capacity reached' });
  });

  it('supports idempotent graceful shutdown', async () => {
    server = await startHttpServer();

    await Promise.all([server.shutdown(), server.shutdown()]);

    expect(server.listening).toBe(false);
  });
});
