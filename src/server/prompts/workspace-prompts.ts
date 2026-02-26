import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BasePromptHandler } from './base-prompt.js';

export class WorkspacePromptHandler implements BasePromptHandler {
  registerPrompts(server: McpServer, _client: BusinessMapClient): void {
    this.registerWorkspaceStatusOverview(server);
  }

  private registerWorkspaceStatusOverview(server: McpServer): void {
    server.registerPrompt(
      'workspace-status-overview',
      {
        title: 'Workspace Status Overview',
        description:
          'Generate a high-level status overview of a workspace, including all boards and their key metrics.',
        argsSchema: {
          workspace_id: z.string().describe('The workspace ID to generate an overview for'),
        },
      },
      ({ workspace_id }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a high-level status overview for workspace ID ${workspace_id}.

Steps:
1. Use \`get_workspace\` to get workspace details.
2. Use \`list_boards\` with workspace_id filter to list all boards in this workspace.
3. For each board (up to 5 boards), use \`list_cards\` to get a count of active cards.
4. For up to 3 boards, use \`get_current_board_structure\` for column distribution.

Deliver a structured overview:

# Workspace Overview — [Workspace Name]
**Date:** [Today's date]

## Workspace Summary
- Total boards
- Total active cards (estimate)
- Overall health status (Green/Yellow/Red based on workload)

## Board Summaries
For each board:
- Board name and ID
- Active card count
- Columns with most cards (top 2-3)
- Any notable concerns (high WIP, empty boards, etc.)

## Highlights
- Most active board
- Any boards with potential bottlenecks
- Boards with no activity

## Recommendations
- Top 2-3 areas to focus attention on

Keep it concise — this is a management-level overview.`,
            },
          },
        ],
      })
    );
  }
}
