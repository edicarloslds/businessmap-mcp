import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BasePromptHandler } from './base-prompt.js';

export class CardPromptHandler implements BasePromptHandler {
  registerPrompts(server: McpServer, _client: BusinessMapClient): void {
    this.registerCreateCardFromDescription(server);
  }

  private registerCreateCardFromDescription(server: McpServer): void {
    server.registerPrompt(
      'create-card-from-description',
      {
        title: 'Create Card from Description',
        description:
          'Guide the creation of a well-structured card from a natural language description.',
        argsSchema: {
          description: z.string().describe('Natural language description of what the card should be'),
          board_id: z.string().describe('The board ID where the card should be created'),
        },
      },
      ({ description, board_id }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help me create a well-structured card in BusinessMap based on the following description:

"${description}"

Target board ID: ${board_id}

Steps to follow:
1. Use \`get_current_board_structure\` to understand the available columns, lanes, and workflows on board ${board_id}.
2. Use \`get_card_types\` to list available card types.
3. Based on the description and board structure, determine the best:
  - Card title (concise, action-oriented)
  - Card description (detailed, with acceptance criteria if applicable)
  - Card type (story, task, bug, etc.)
  - Target column (most appropriate initial stage)
  - Lane (if applicable)
  - Size/priority estimate (if inferable)

4. Use \`create_card\` to create the card with the determined values.
5. Confirm the card was created and provide its ID and a link summary.

Make the card title clear and actionable. Include acceptance criteria in the description if the request is a feature or user story.`,
            },
          },
        ],
      })
    );
  }
}
