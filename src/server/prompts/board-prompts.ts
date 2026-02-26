import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BasePromptHandler } from './base-prompt.js';

export class BoardPromptHandler implements BasePromptHandler {
  registerPrompts(server: McpServer, _client: BusinessMapClient): void {
    this.registerAnalyzeBoardPerformance(server);
    this.registerGenerateBoardReport(server);
  }

  private registerAnalyzeBoardPerformance(server: McpServer): void {
    server.registerPrompt(
      'analyze-board-performance',
      {
        title: 'Analyze Board Performance',
        description:
          'Analyze a board\'s performance: flow efficiency, bottlenecks, cycle time and workload distribution across columns and lanes.',
        argsSchema: {
          board_id: z.string().describe('The board ID to analyze'),
        },
      },
      ({ board_id }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please analyze the performance of board ID ${board_id} in BusinessMap.

Follow these steps:
1. Use \`get_current_board_structure\` to retrieve the full board structure (workflows, columns, lanes).
2. Use \`list_cards\` to retrieve all active cards on the board.
3. Use \`get_workflow_cycle_time_columns\` for each workflow to understand which columns count for cycle time.

Based on the data collected, provide a structured analysis including:

**Flow Analysis**
- Number of cards per column and lane
- Columns with the highest accumulation (bottlenecks)
- WIP distribution

**Cycle Time**
- Average cycle time estimation per column
- Columns that are cycle time columns vs. buffer columns

**Workload Distribution**
- Cards per assignee (if available)
- Lanes with the most blocked/overdue items

**Recommendations**
- Top 3 actionable improvements to increase flow efficiency
- Any WIP limit violations or risks identified

Format the response as a clear executive report with sections and bullet points.`,
            },
          },
        ],
      })
    );
  }

  private registerGenerateBoardReport(server: McpServer): void {
    server.registerPrompt(
      'generate-board-report',
      {
        title: 'Generate Board Report',
        description:
          'Generate a comprehensive status report for a board, including cards summary, progress, and highlights.',
        argsSchema: {
          board_id: z.string().describe('The board ID to report on'),
        },
      },
      ({ board_id }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a comprehensive status report for board ID ${board_id}.

Steps to gather data:
1. Use \`get_current_board_structure\` to get the board structure.
2. Use \`list_cards\` to get all cards (use filters as needed for active cards).
3. For a sample of cards (up to 10), use \`get_card\` to get detailed information.

Report structure:
# Board Status Report — [Board Name]
**Date:** [Today's date]

## Executive Summary
- Total cards in progress
- Total cards completed (if available)
- Key highlights and risks

## Column Breakdown
For each column: card count, key items, blockers

## Recently Updated Cards
List the 5 most recently updated cards with status

## Risks & Blockers
- Cards that appear stuck or overdue
- Any notable concerns

## Next Steps
- Suggested actions based on current board state

Keep the report concise, factual, and actionable.`,
            },
          },
        ],
      })
    );
  }
}
