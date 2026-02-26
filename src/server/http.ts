import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { BusinessMapMcpServer } from './mcp-server.js';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

interface SessionContext {
  transport: StreamableHTTPServerTransport;
  server: BusinessMapMcpServer;
}

export async function startHttpServer() {
  const app = express();

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

  const sessions = new Map<string, SessionContext>();

  // Single /mcp endpoint handles GET, POST and DELETE (Streamable HTTP spec 2025-03-26)
  const handleMcpRequest = async (
    req: express.Request,
    res: express.Response
  ) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (req.method === 'POST' && !sessionId) {
      const sessionServer = new BusinessMapMcpServer();

      // New session: create a fresh transport
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, { transport, server: sessionServer });
          logger.info(`New MCP session initialized: ${id}`);
        },
        onsessionclosed: async (id) => {
          const session = sessions.get(id);
          sessions.delete(id);

          try {
            await session?.server.server.close();
          } catch (error) {
            logger.warn(`Error while closing MCP session ${id}:`, error);
          }

          logger.info(`MCP session closed: ${id}`);
        },
        allowedHosts: config.server.allowedHosts,
        allowedOrigins: config.server.allowedOrigins,
        enableDnsRebindingProtection: true,
      });

      try {
        await sessionServer.server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        logger.error('Failed to handle new MCP session:', error);
        try {
          await sessionServer.server.close();
        } catch (closeError) {
          logger.warn('Error while cleaning up failed session:', closeError);
        }
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to initialize MCP session' });
        }
      }
      return;
    }

    // Existing session
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: `Session not found: ${sessionId}` });
        return;
      }
      try {
        await session.transport.handleRequest(req, res, req.body);
      } catch (error) {
        logger.error(`Error handling request for session ${sessionId}:`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
      return;
    }

    res.status(400).json({ error: 'Missing mcp-session-id header' });
  };

  app.get('/mcp', handleMcpRequest);
  app.post('/mcp', handleMcpRequest);
  app.delete('/mcp', handleMcpRequest);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: config.server.version });
  });

  const port = config.server.port;

  app.listen(port, () => {
    logger.success(`HTTP Server running on port ${port}`);
    logger.info(`MCP Endpoint: http://localhost:${port}/mcp`);
    logger.info(`Health Check: http://localhost:${port}/health`);
    logger.info(`Allowed origins: ${config.server.allowedOrigins.join(', ')}`);
    logger.info(`Allowed hosts: ${config.server.allowedHosts.join(', ')}`);
  });
}
