import { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { BusinessMapMcpServer } from './mcp-server.js';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

interface SessionContext {
  transport: StreamableHTTPServerTransport;
  server: BusinessMapMcpServer;
  lastActivityAt: number;
}

async function closeSession(id: string, session: SessionContext): Promise<void> {
  try {
    await session.server.server.close();
  } catch (error) {
    logger.warn(`Error while closing MCP session ${id}:`, error);
  }
  logger.info(`MCP session closed: ${id}`);
}

async function closeUninitializedServer(server: BusinessMapMcpServer): Promise<void> {
  try {
    await server.server.close();
  } catch (error) {
    logger.warn('Error while cleaning up uninitialized MCP server:', error);
  }
}

async function cleanupFailedSession(
  id: string | undefined,
  server: BusinessMapMcpServer,
  sessions: Map<string, SessionContext>
): Promise<void> {
  const session = id ? sessions.get(id) : undefined;
  if (id && session) {
    sessions.delete(id);
    await closeSession(id, session);
    return;
  }
  await closeUninitializedServer(server);
}

function closeHttpListener(server: Server): Promise<void> {
  if (!server.listening) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export interface HttpServerOptions {
  middlewares?: express.RequestHandler[];
  bodyLimit?: string;
  maxSessions?: number;
  sessionTimeoutMs?: number;
}

export interface ManagedHttpServer extends Server {
  shutdown(): Promise<void>;
}

export async function startHttpServer(options: HttpServerOptions = {}): Promise<ManagedHttpServer> {
  const app = express();
  const bodyLimit = options.bodyLimit ?? config.server.bodyLimit;
  const maxSessions = options.maxSessions ?? config.server.maxSessions;
  const sessionTimeoutMs = options.sessionTimeoutMs ?? config.server.sessionTimeoutMs;
  if (!Number.isSafeInteger(maxSessions) || maxSessions <= 0) {
    throw new TypeError('maxSessions must be a positive integer');
  }
  if (!Number.isSafeInteger(sessionTimeoutMs) || sessionTimeoutMs <= 0) {
    throw new TypeError('sessionTimeoutMs must be a positive integer');
  }

  // Disable X-Powered-By header to prevent disclosing version/framework info
  app.disable('x-powered-by');

  // Parse JSON bodies (required for StreamableHTTP transport)
  app.use(express.json({ limit: bodyLimit }));

  // Enable CORS with configured allowed origins
  app.use(
    cors({
      origin: config.server.allowedOrigins,
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'mcp-session-id', 'last-event-id'],
      exposedHeaders: ['mcp-session-id'],
    })
  );

  // Apply custom middlewares (e.g. for authentication/authorization)
  if (options.middlewares && options.middlewares.length > 0) {
    options.middlewares.forEach((middleware) => {
      app.use(middleware);
    });
  }

  // Request logging middleware
  app.use((req, _res, next) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const sessionSuffix = sessionId ? ` [session: ${sessionId}]` : '';
    logger.debug(`${req.method} ${req.path}${sessionSuffix}`);
    next();
  });

  const sessions = new Map<string, SessionContext>();
  let pendingSessions = 0;
  let isShuttingDown = false;

  // Periodic cleanup of inactive sessions
  const cleanupInterval = setInterval(async () => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.lastActivityAt > sessionTimeoutMs) {
        logger.info(`Closing idle MCP session (timeout): ${id}`);
        sessions.delete(id);
        await closeSession(id, session);
      }
    }
  }, 60_000); // check every minute

  // Prevent the interval from blocking process exit
  cleanupInterval.unref();

  const handleNewSession = async (
    req: express.Request,
    res: express.Response,
    logResponse: (statusCode: number) => void,
    sendError: (statusCode: number, message: string) => void
  ) => {
    if (sessions.size + pendingSessions >= maxSessions) {
      sendError(503, 'HTTP session capacity reached');
      return;
    }

    pendingSessions++;
    let reservationReleased = false;
    let initializedSessionId: string | undefined;
    let sessionServer: BusinessMapMcpServer | undefined;
    try {
      const module = await import('./mcp-server.js');
      sessionServer = new module.BusinessMapMcpServer();

      // New session: create a fresh transport
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          initializedSessionId = id;
          if (!reservationReleased) {
            pendingSessions--;
            reservationReleased = true;
          }
          sessions.set(id, { transport, server: sessionServer!, lastActivityAt: Date.now() });
          logger.info(`New MCP session initialized: ${id}`);
        },
        onsessionclosed: async (id) => {
          const session = sessions.get(id);
          sessions.delete(id);
          if (session) {
            await closeSession(id, session);
          }
        },
        allowedHosts: config.server.allowedHosts,
        allowedOrigins: config.server.allowedOrigins,
        enableDnsRebindingProtection: true,
      });

      await sessionServer.server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      logResponse(res.statusCode);

      if (initializedSessionId && isShuttingDown) {
        const session = sessions.get(initializedSessionId);
        sessions.delete(initializedSessionId);
        if (session) {
          await closeSession(initializedSessionId, session);
        }
      } else if (!initializedSessionId) {
        await closeUninitializedServer(sessionServer);
      }
    } catch (error) {
      logger.error('Failed to handle new MCP session:', error);
      if (sessionServer) {
        await cleanupFailedSession(initializedSessionId, sessionServer, sessions);
      }
      if (!res.headersSent) {
        sendError(500, 'Failed to initialize MCP session');
      }
    } finally {
      if (!reservationReleased) {
        pendingSessions--;
      }
    }
  };

  const handleExistingSession = async (
    req: express.Request,
    res: express.Response,
    sessionId: string,
    logResponse: (statusCode: number) => void,
    sendError: (statusCode: number, message: string) => void
  ) => {
    const session = sessions.get(sessionId);
    if (!session) {
      sendError(404, `Session not found: ${sessionId}`);
      return;
    }
    session.lastActivityAt = Date.now();
    try {
      await session.transport.handleRequest(req, res, req.body);
      logResponse(res.statusCode);
    } catch (error) {
      logger.error(`Error handling request for session ${sessionId}:`, error);
      if (!res.headersSent) {
        sendError(500, 'Internal server error');
      }
    }
  };

  // Single /mcp endpoint handles GET, POST and DELETE (Streamable HTTP spec 2025-03-26)
  const handleMcpRequest = async (
    req: express.Request,
    res: express.Response
  ) => {
    const start = Date.now();
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    const logResponse = (statusCode: number) => {
      const duration = Date.now() - start;
      const sessionSuffix = sessionId ? ` [session: ${sessionId}]` : '';
      logger.debug(
        `${req.method} ${req.path} -> ${statusCode} (${duration}ms)${sessionSuffix}`
      );
    };

    const sendError = (statusCode: number, message: string) => {
      logResponse(statusCode);
      res.status(statusCode).json({ error: message });
    };

    if (isShuttingDown) {
      sendError(503, 'Server is shutting down');
      return;
    }

    if (req.method === 'POST' && !sessionId) {
      await handleNewSession(req, res, logResponse, sendError);
      return;
    }

    // Existing session
    if (sessionId) {
      await handleExistingSession(req, res, sessionId, logResponse, sendError);
      return;
    }

    sendError(400, 'Missing mcp-session-id header');
  };

  app.get('/mcp', handleMcpRequest);
  app.post('/mcp', handleMcpRequest);
  app.delete('/mcp', handleMcpRequest);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: config.server.version });
  });

  app.get('/ready', (_req, res) => {
    const hasCapacity = sessions.size + pendingSessions < maxSessions;
    if (isShuttingDown || !hasCapacity) {
      res.status(503).json({ status: 'not_ready', version: config.server.version });
      return;
    }
    res.json({ status: 'ready', version: config.server.version });
  });

  const port = config.server.port;

  const server = app.listen(port, () => {
    logger.success(`HTTP Server running on port ${port}`);
    logger.info(`MCP Endpoint: http://localhost:${port}/mcp`);
    logger.info(`Health Check: http://localhost:${port}/health`);
    logger.info(`Readiness Check: http://localhost:${port}/ready`);
    logger.info(`Allowed origins: ${config.server.allowedOrigins.join(', ')}`);
    logger.info(`Allowed hosts: ${config.server.allowedHosts.join(', ')}`);
  });

  server.on('close', () => {
    clearInterval(cleanupInterval);
  });

  let shutdownPromise: Promise<void> | undefined;
  const shutdown = (): Promise<void> => {
    shutdownPromise ??= (async () => {
      isShuttingDown = true;
      clearInterval(cleanupInterval);

      const closeServer = closeHttpListener(server);

      const activeSessions = [...sessions.entries()];
      sessions.clear();
      await Promise.allSettled(
        activeSessions.map(([id, session]) => closeSession(id, session))
      );

      server.closeAllConnections();
      await closeServer;
      logger.info('HTTP server shut down');
    })();
    return shutdownPromise;
  };

  return Object.assign(server, { shutdown });
}
