# Logging System

## Overview

The BusinessMap MCP Server uses a structured logging system that ensures compatibility with the Model Context Protocol (MCP) while providing clear, categorized log output.

## Why STDERR?

The MCP protocol uses **STDOUT exclusively for JSON-RPC communication**. Any output to STDOUT that is not valid JSON-RPC will corrupt the protocol and cause errors like:

```
MCP businessmap: Unexpected token '✅', "✅ Configur"... is not valid JSON
```

Therefore, **all logging must go to STDERR** (`console.error` or `process.stderr.write`).

## Logger Utility

Instead of using raw `console.error` for all messages (which can be misleading), we provide a `logger` utility that categorizes messages while still outputting to STDERR.

### Log Levels

```typescript
export enum LogLevel {
  DEBUG = 0,    // Detailed debugging information
  INFO = 1,     // Informational messages (default)
  WARN = 2,     // Warning messages
  ERROR = 3,    // Error messages
  NONE = 4,     // Disable all logging
}
```

### Usage Examples

```typescript
import { logger } from './utils/logger.js';

// Success messages (shown at INFO level)
logger.success('Successfully connected to BusinessMap API');

// Informational messages (shown at INFO level)
logger.info('🚀 Starting BusinessMap MCP Server v1.0.0');
logger.info('📡 BusinessMap API: https://account.kanbanize.com/api/v2');

// Debug messages (shown at DEBUG level only)
logger.debug('Fetching effective cycle time columns for board 123');

// Warning messages (shown at WARN level and above)
logger.warn('Direct board lookup failed, trying fallback method');

// Error messages (shown at ERROR level and above)
logger.error('Failed to connect to API', errorObject);
```

### Output Format

All log messages include timestamps and clear prefixes:

```
[2025-11-15T10:30:45.123Z] ✅ SUCCESS: Successfully connected to BusinessMap API
[2025-11-15T10:30:45.456Z] ℹ️  INFO: 🚀 Starting BusinessMap MCP Server v1.0.0
[2025-11-15T10:30:46.789Z] 🔍 DEBUG: Fetching effective cycle time columns for board 123
[2025-11-15T10:30:47.012Z] ⚠️  WARN: Direct board lookup failed, trying fallback method
[2025-11-15T10:30:47.345Z] ❌ ERROR: Failed to connect to API
```

Set `LOG_FORMAT=json` for machine-readable logs:

```json
{"timestamp":"2026-07-09T18:00:00.000Z","level":"info","message":"MCP mutation tool completed","correlationId":"request-123","details":[{"event":"mcp_tool_mutation","tool":"update_card","outcome":"success","durationMs":42,"identifiers":{"card_id":123}}]}
```

HTTP requests accept an optional `x-request-id` header and echo it in the
response. Invalid or missing IDs are replaced with a UUID. The same correlation
ID is propagated to BusinessMap API calls and included in logs. Mutation audit
events contain tool names and numeric identifiers only; free-form card content,
comments, descriptions, email addresses, and credentials are not logged.

## Configuration

Set the `LOG_LEVEL` environment variable to control verbosity:

```bash
# Show all messages including debug
LOG_LEVEL=0 npx @edicarlos.lds/businessmap-mcp

# Show info, warnings, and errors (default)
LOG_LEVEL=1 npx @edicarlos.lds/businessmap-mcp

# Show only warnings and errors
LOG_LEVEL=2 npx @edicarlos.lds/businessmap-mcp

# Show only errors
LOG_LEVEL=3 npx @edicarlos.lds/businessmap-mcp

# Disable all logging
LOG_LEVEL=4 npx @edicarlos.lds/businessmap-mcp
```

Use `LOG_FORMAT=text` (default) for human-readable output or
`LOG_FORMAT=json` for log aggregation systems.

### In Claude Desktop Config

```json
{
  "mcpServers": {
    "Businessmap": {
      "command": "npx",
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token",
        "BUSINESSMAP_API_URL": "https://account.kanbanize.com/api/v2",
        "LOG_LEVEL": "1"
      }
    }
  }
}
```

## Benefits

### ✅ Clear Message Categorization

Instead of everything being "errors" (when using `console.error`), messages are properly categorized:

- **SUCCESS**: Operations completed successfully
- **INFO**: General informational messages
- **DEBUG**: Detailed debugging information
- **WARN**: Non-critical issues or fallback scenarios
- **ERROR**: Actual errors and failures

### ✅ MCP Protocol Compliance

All output goes to STDERR, keeping STDOUT clean for JSON-RPC:

```typescript
// ❌ BAD - Breaks MCP protocol
console.log('Starting server...');

// ✅ GOOD - Uses STDERR
console.error('Starting server...');

// ✅ BETTER - Categorized and uses STDERR
logger.info('Starting server...');
```

### ✅ Configurable Verbosity

Control what gets logged without changing code:

```bash
# Production: minimal logging
LOG_LEVEL=2

# Development: detailed logging
LOG_LEVEL=0
```

### ✅ Consistent Format

All messages follow the same format with timestamps and clear prefixes, making logs easier to read and parse.

## Migration from console.error

When migrating from `console.error` to the logger utility, choose the appropriate method:

```typescript
// Before
console.error('✅ Successfully connected');
console.error('🔄 Retrying connection...');
console.error('⚠️ Fallback method used');
console.error('❌ Connection failed');

// After
logger.success('Successfully connected');
logger.info('Retrying connection...');
logger.warn('Fallback method used');
logger.error('Connection failed');
```

## Implementation Details

The logger is implemented in `src/utils/logger.ts` and uses a singleton pattern. All methods internally call `console.error` to ensure output goes to STDERR, maintaining MCP protocol compatibility.
