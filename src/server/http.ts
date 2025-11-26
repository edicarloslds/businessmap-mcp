import express from 'express';
import cors from 'cors';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { BusinessMapMcpServer } from './mcp-server.js';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

export async function startHttpServer(mcpServer: BusinessMapMcpServer) {
    const app = express();
    const transports = new Map<string, SSEServerTransport>();

    // Enable CORS
    app.use(cors());

    // Set up SSE endpoint
    app.get('/sse', async (req, res) => {
        logger.info('New SSE connection request');

        const transport = new SSEServerTransport(
            '/message',
            res
        );

        const sessionId = transport.sessionId;
        transports.set(sessionId, transport);

        logger.info(`Created new transport with session ID: ${sessionId}`);

        // Clean up on close
        res.on('close', () => {
            logger.info(`SSE connection closed for session ${sessionId}`);
            transports.delete(sessionId);
        });

        try {
            await mcpServer.server.connect(transport);
            await transport.start();
        } catch (error) {
            logger.error(`Failed to start transport for session ${sessionId}:`, error);
            transports.delete(sessionId);
            if (!res.headersSent) {
                res.status(500).send('Failed to start SSE transport');
            }
        }
    });

    // Set up message endpoint
    app.post('/message', async (req, res) => {
        const sessionId = req.query.sessionId as string;

        if (!sessionId) {
            res.status(400).send('Missing sessionId query parameter');
            return;
        }

        const transport = transports.get(sessionId);

        if (!transport) {
            res.status(404).send(`Session not found: ${sessionId}`);
            return;
        }

        logger.debug(`Received JSON-RPC message for session ${sessionId}`);
        await transport.handlePostMessage(req, res);
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', version: config.server.version });
    });

    const port = config.server.port;

    app.listen(port, () => {
        logger.success(`HTTP Server running on port ${port}`);
        logger.info(`SSE Endpoint: http://localhost:${port}/sse`);
        logger.info(`Message Endpoint: http://localhost:${port}/message`);
    });
}
