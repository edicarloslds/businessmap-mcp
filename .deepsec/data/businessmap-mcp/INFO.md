# businessmap-mcp

## What this codebase does

A Model Context Protocol (MCP) server that proxies AI clients to the
BusinessMap/Kanbanize REST API. TypeScript/Node ≥18. Ships ~59 tools, 5
resources, 4 prompts over two transports: stdio (default, local MCP clients)
and Streamable HTTP (`TRANSPORT=http`, single `/mcp` endpoint). Distributed
via npm as `@edicarlos.lds/businessmap-mcp`; users typically run it via `npx`
inside Claude Desktop / Cursor / VS Code. There is no end-user authn — the
server holds a single BusinessMap API token and acts on behalf of whoever
talks to it.

## Auth shape

- **Upstream auth**: a single `BUSINESSMAP_API_TOKEN` is sent on every
  outbound call as the `apikey` header on the shared `BusinessMapClient`
  axios instance. There is no per-user identity.
- **Read-only gate**: `config.businessMap.readOnlyMode` is threaded into each
  `*ToolHandler.registerTools(server, client, readOnlyMode)` — write tools
  must early-return / skip registration when it is `true`.
- **HTTP transport hardening**: `StreamableHTTPServerTransport` is configured
  with `enableDnsRebindingProtection: true`, `allowedHosts`, `allowedOrigins`;
  `cors()` uses the same allowlist; `x-powered-by` is disabled.
- **No client authentication by default**. `startHttpServer({ middlewares })`
  accepts user-supplied Express middlewares as the only hook for auth/rate
  limiting — see `docs/MIDDLEWARE.md`.
- **Sessions**: in-memory `Map<sessionId, SessionContext>` keyed by
  `mcp-session-id` header, 30-min idle timeout via `cleanupInterval`.

## Threat model

The crown jewel is `BUSINESSMAP_API_TOKEN` — leak = full tenant takeover on
Kanbanize. The next risk is an exposed HTTP-mode deployment with no
user-supplied auth middleware: anyone reaching `/mcp` can drive every write
tool. Tool inputs come from an LLM, so argument-injection into the
BusinessMap API surface (IDs, query params, board/card payloads) is in
scope. Log injection / token echo into stdout matters because stdio mode
muxes logs with MCP frames.

## Project-specific patterns to flag

- **Write tool registered without honoring `readOnlyMode`**: any new
  `registerTools(server, client, readOnlyMode)` that calls
  `server.tool(...)` for a mutating op without checking `readOnlyMode`
  first. Pattern lives in every handler under `src/server/tools/`.
- **Outbound calls bypassing `BusinessMapClient.http`**: a fresh
  `axios.create` / `fetch` in a tool or module skips the 30s timeout, the
  error-transform interceptor, and the centralized `apikey` header — and
  risks token duplication.
- **HTTP hardening regressions**: changes that flip
  `enableDnsRebindingProtection` to false, widen `ALLOWED_ORIGINS` /
  `ALLOWED_HOSTS` to `*`, or add a new Express route outside `/mcp` and
  `/health` without going through the same CORS/host checks.
- **Token / secret in logs**: any `logger.{debug,info,warn,error}` or
  `console.*` that interpolates `config.businessMap.apiToken`, an
  `Authorization`/`apikey` header value, or a full axios request/response
  object. Stdio transport shares the channel with MCP frames.
- **Tool input reaching API without zod validation**: tool handlers are
  expected to use the schemas under `src/schemas/`. A handler that takes
  raw `args: any` / `unknown` and forwards it into the BusinessMap client
  is a red flag.

## Known false-positives

- `GET /health` is intentionally unauthenticated and returns
  `{ status, version }` only — not a disclosure issue.
- Default `ALLOWED_ORIGINS=http://localhost` and the localhost entries
  appended to `defaultAllowedHosts` are intentional dev defaults.
- `apikey: config.apiToken` on the axios instance in
  `BusinessMapClient` is the expected upstream auth header, not a leak.
- `console.error('💥 Unhandled error:', error)` in `src/index.ts` is the
  last-resort crash logger and intentionally bypasses the structured
  logger.
- The in-memory `sessions` `Map` (no persistence, no encryption-at-rest)
  is by design — sessions are per-process and short-lived.
- `dotenv.config()` reading `.env` from `process.cwd()` is intentional
  for local dev / Docker; production deployments are expected to inject
  env vars directly.
