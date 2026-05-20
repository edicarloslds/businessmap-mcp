import { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { BusinessMapMcpServer } from './mcp-server.js';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

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

export interface HttpServerOptions {
  middlewares?: express.RequestHandler[];
}

export async function startHttpServer(options: HttpServerOptions = {}): Promise<Server> {
  const app = express();

  // Disable X-Powered-By header to prevent disclosing version/framework info
  app.disable('x-powered-by');

  // Parse JSON bodies (required for StreamableHTTP transport)
  app.use(express.json());

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

  // Periodic cleanup of inactive sessions
  const cleanupInterval = setInterval(async () => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.lastActivityAt > SESSION_TIMEOUT_MS) {
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
    const sessionServer = new BusinessMapMcpServer();

    // New session: create a fresh transport
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        sessions.set(id, { transport, server: sessionServer, lastActivityAt: Date.now() });
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

    try {
      await sessionServer.server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      logResponse(res.statusCode);
    } catch (error) {
      logger.error('Failed to handle new MCP session:', error);
      try {
        await sessionServer.server.close();
      } catch (closeError) {
        logger.warn('Error while cleaning up failed session:', closeError);
      }
      if (!res.headersSent) {
        sendError(500, 'Failed to initialize MCP session');
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

  const port = config.server.port;

  return app.listen(port, () => {
    logger.success(`HTTP Server running on port ${port}`);
    logger.info(`MCP Endpoint: http://localhost:${port}/mcp`);
    logger.info(`Health Check: http://localhost:${port}/health`);
    logger.info(`Allowed origins: ${config.server.allowedOrigins.join(', ')}`);
    logger.info(`Allowed hosts: ${config.server.allowedHosts.join(', ')}`);
  });
}
