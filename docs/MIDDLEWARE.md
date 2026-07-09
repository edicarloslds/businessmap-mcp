# Programmatic Usage & Custom Middleware Guide

This guide is designed for developers who want to embed the **BusinessMap MCP Server** programmatically into their own Node.js/TypeScript applications, and implement custom logic (such as authentication, authorization, logging, or rate-limiting) using Express middlewares.

---

## 🚀 Quick Start

Ensure you have installed the package:

```bash
npm install @edicarlos.lds/businessmap-mcp
```

You can import `startHttpServer` and launch the MCP server in HTTP mode programmatically:

```typescript
import { startHttpServer } from '@edicarlos.lds/businessmap-mcp';

// Start HTTP server with default options
const server = await startHttpServer();

// Close the listener and all MCP sessions during application shutdown
await server.shutdown();
```

---

## 🔒 Implementing Custom Authentication

Since the HTTP transport does not enforce authentication by default, you can inject custom Express middlewares to secure the `/mcp` endpoints.

### Example 1: Static API Key Authentication
This middleware checks for a pre-configured header (e.g. `Authorization` or `x-api-key`).

```typescript
import { startHttpServer } from '@edicarlos.lds/businessmap-mcp';

const API_KEY = process.env.MCP_SERVER_KEY || 'your-secret-api-key';

await startHttpServer({
  middlewares: [
    (req, res, next) => {
      // Allow orchestrator probes to remain public
      if (req.path === '/health' || req.path === '/ready') {
        return next();
      }

      const clientKey = req.headers['x-api-key'] || req.headers['authorization'];
      
      if (clientKey === API_KEY || clientKey === `Bearer ${API_KEY}`) {
        return next(); // Authenticated
      }

      res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    }
  ]
});
```

### Example 2: Integration with third-party Identity Providers (JWT/OAuth)
You can use standard Express ecosystem libraries (like `express-oauth2-jwt-bearer` or custom JWT verification) to authenticate users remotely.

```typescript
import { startHttpServer } from '@edicarlos.lds/businessmap-mcp';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

await startHttpServer({
  middlewares: [
    (req, res, next) => {
      if (req.path === '/health' || req.path === '/ready') return next();

      const authHeader = req.headers['authorization'];
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing token' });
      }

      const token = authHeader.split(' ')[1];

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Inject user info into request if needed
        req.user = decoded;
        next();
      } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
      }
    }
  ]
});
```

---

## 🛡️ Adding Security and Rate-Limiting

You can pair authentication with popular security headers and rate-limiting packages from the npm ecosystem.

```typescript
import { startHttpServer } from '@edicarlos.lds/businessmap-mcp';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Limit clients to 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

await startHttpServer({
  middlewares: [
    helmet(),  // Secure Express HTTP headers
    limiter,   // Limit rate
  ],
});
```

---

## ⚙️ Middleware Execution Order

Middlewares are executed sequentially in the order they are passed in the `middlewares` array.
1. **JSON Parser & CORS** (Default built-in middlewares run first).
2. **Custom Middlewares** (Your injected middlewares run next, allowing you to intercept and reject requests early).
3. **Session Logging & Session Resolution** (Built-in MCP routing middleware matches the `/mcp` endpoints last).

---

## HTTP Resource Limits

The standalone server supports `HTTP_BODY_LIMIT` (default `1mb`),
`HTTP_MAX_SESSIONS` (default `100`), and `HTTP_SESSION_TIMEOUT_MS` (default 30
minutes). Embedded applications can override them directly:

```typescript
const server = await startHttpServer({
  bodyLimit: '512kb',
  maxSessions: 50,
  sessionTimeoutMs: 15 * 60 * 1000,
});
```

`GET /health` is a liveness probe. `GET /ready` returns `503` while the server
is shutting down or cannot accept another session.

---

## 🧪 Testing Your Middleware

You can test HTTP requests using `curl` or any API client (like Postman):

```bash
# Testing request with header authorization
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```
