# Tools, Resources & Prompts Reference

Complete reference for all tools, resources, and prompts provided by the BusinessMap MCP Server.

## Summary

| Category | Count |
|----------|-------|
| Tools | 56 |
| Resources | 5 |
| Prompts | 4 |

---

## Tools

### Workspace Management (3 tools)

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `list_workspaces` | Get a list of all workspaces | ✅ |
| `get_workspace` | Get details of a specific workspace | ✅ |
| `create_workspace` | Create a new workspace | ❌ |

---

### Board Management (11 tools)

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `list_boards` | Get a list of boards with optional workspace filter | ✅ |
| `search_board` | Search for a board by ID or name, with fallback to list | ✅ |
| `get_columns` | Get all columns for a board | ✅ |
| `get_lanes` | Get all lanes/swimlanes for a board | ✅ |
| `get_lane` | Get details of a specific lane/swimlane | ✅ |
| `get_current_board_structure` | Get the complete structure of a board (workflows, columns, lanes, configs) | ✅ |
| `create_board` | Create a new board in a workspace | ❌ |
| `create_lane` | Create a new lane/swimlane in a board | ❌ |
| `create_column` | Create a new column (main or sub-column). Section: 1=Backlog, 2=Requested, 3=Progress, 4=Done | ❌ |
| `update_column` | Update the details of a specific column | ❌ |
| `delete_column` | Delete a column from a board | ❌ ⚠️ |

---

### Card Management (36 tools)

#### Basic Operations

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `list_cards` | Get cards from a board with optional filters | ✅ |
| `get_card` | Get detailed card information | ✅ |
| `get_card_size` | Get the size/points of a specific card | ✅ |
| `get_card_types` | Get all available card types | ✅ |
| `create_card` | Create a new card in a board | ❌ |
| `move_card` | Move a card to a different column or lane | ❌ |
| `update_card` | Update card properties | ❌ |
| `set_card_size` | Set the size/points of a specific card | ❌ |
| `delete_card` | Permanently delete a card (irreversible) | ❌ ⚠️ |

#### Comments

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `get_card_comments` | Get all comments for a specific card | ✅ |
| `get_card_comment` | Get details of a specific comment | ✅ |
| `create_comment` | Add a new comment to a card | ❌ |
| `update_comment` | Update the text of an existing comment | ❌ |
| `delete_comment` | Delete a comment from a card | ❌ ⚠️ |

#### Custom Fields

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `get_card_custom_fields` | Get all custom fields for a specific card | ✅ |

#### Outcomes & History

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `get_card_outcomes` | Get all outcomes for a specific card | ✅ |
| `get_card_history` | Get the history of a specific card outcome | ✅ |

#### Relationships

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `get_card_linked_cards` | Get all linked cards for a specific card | ✅ |

#### Subtasks

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `get_card_subtasks` | Get all subtasks for a specific card | ✅ |
| `get_card_subtask` | Get details of a specific subtask | ✅ |
| `create_card_subtask` | Create a new subtask for a card | ❌ |

#### Parent-Child Relationships

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `get_card_parents` | Get a list of parent cards for a specific card | ✅ |
| `get_card_parent` | Check if a card is a parent of a given card | ✅ |
| `get_card_parent_graph` | Get parent cards including their parents (full graph) | ✅ |
| `get_card_children` | Get a list of child cards of a specified parent card | ✅ |
| `add_card_parent` | Make a card a parent of a given card | ❌ |
| `remove_card_parent` | Remove the link between a child card and a parent card | ❌ |

#### Blocking

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `block_card` | Block a card and set a reason/comment | ❌ |
| `unblock_card` | Unblock a card by removing its block reason | ❌ |

#### Tags

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `create_tag` | Create a new tag in the workspace | ❌ |
| `add_tag_to_card` | Add an existing tag to a card | ❌ |
| `remove_tag_from_card` | Remove a tag from a card | ❌ |

#### Stickers

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `add_sticker_to_card` | Add a sticker to a card | ❌ |
| `remove_sticker_from_card` | Remove a sticker from a card using the sticker-card association ID | ❌ |

#### Predecessors

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `add_predecessor` | Establish or update a predecessor-successor relationship between two cards | ❌ |
| `remove_predecessor` | Remove the predecessor-successor relationship between two cards | ❌ |

---

### Custom Field Management (1 tool)

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `get_custom_field` | Get details of a specific custom field by ID | ✅ |

---

### Workflow & Cycle Time Analysis (2 tools)

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `get_workflow_cycle_time_columns` | Get workflow's cycle time columns | ✅ |
| `get_workflow_effective_cycle_time_columns` | Get workflow's effective cycle time columns | ✅ |

---

### User Management (4 tools)

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `list_users` | Get a list of all users | ✅ |
| `get_user` | Get details of a specific user | ✅ |
| `get_current_user` | Get details of the current logged user | ✅ |
| `invite_user` | Add and invite a new user by email | ❌ |

---

### System (2 tools)

| Tool | Description | Read-Only Safe |
|------|-------------|:--------------:|
| `health_check` | Check the connection to BusinessMap API | ✅ |
| `get_api_info` | Get information about the BusinessMap API | ✅ |

---

## Resources

MCP resources provide structured data access via URI. Clients can read resources directly without invoking tools.

| URI | Name | Description | Listable |
|-----|------|-------------|:--------:|
| `businessmap://workspaces` | workspaces | List all workspaces | ✅ |
| `businessmap://boards` | boards | List all boards | ✅ |
| `businessmap://boards/{board_id}` | board | Get details of a specific board | ❌ |
| `businessmap://boards/{board_id}/cards` | cards | List all cards for a specific board | ✅ |
| `businessmap://cards/{card_id}` | card | Get details of a specific card | ❌ |

---

## Prompts

MCP prompts provide guided, multi-step workflows for common AI-assisted tasks.

### `analyze-board-performance`

**Title:** Analyze Board Performance

Analyze a board's performance: flow efficiency, bottlenecks, cycle time, and workload distribution across columns and lanes.

**Arguments:**
- `board_id` (required) — The board ID to analyze

**Workflow:**
1. Uses `get_current_board_structure` to retrieve the full board structure
2. Uses `list_cards` to retrieve all active cards
3. Uses `get_workflow_cycle_time_columns` for each workflow
4. Delivers a structured analysis covering flow efficiency, cycle time, workload distribution, and actionable recommendations

---

### `generate-board-report`

**Title:** Generate Board Report

Generate a comprehensive status report for a board, including cards summary, progress, and highlights.

**Arguments:**
- `board_id` (required) — The board ID to report on

**Workflow:**
1. Uses `get_current_board_structure` to get the board structure
2. Uses `list_cards` to get all cards
3. Uses `get_card` for detailed info on a sample of cards
4. Generates a structured report with: Executive Summary, Column Breakdown, Recently Updated Cards, Risks & Blockers, and Next Steps

---

### `create-card-from-description`

**Title:** Create Card from Description

Guide the creation of a well-structured card from a natural language description.

**Arguments:**
- `description` (required) — Natural language description of what the card should be
- `board_id` (required) — The board ID where the card should be created

**Workflow:**
1. Uses `get_current_board_structure` to understand available columns, lanes, and workflows
2. Uses `get_card_types` to list available card types
3. Determines the best card title, description, type, target column, lane, and size/priority
4. Uses `create_card` to create the card and confirms creation with ID and summary

---

### `workspace-status-overview`

**Title:** Workspace Status Overview

Generate a high-level status overview of a workspace, including all boards and their key metrics.

**Arguments:**
- `workspace_id` (required) — The workspace ID to generate an overview for

**Workflow:**
1. Uses `get_workspace` to get workspace details
2. Uses `list_boards` with `workspace_id` filter to list all boards
3. Uses `list_cards` for each board to get active card counts
4. Uses `get_current_board_structure` for up to 3 boards
5. Delivers a structured overview with: Workspace Summary, Board Summaries, Highlights, and Recommendations

---

## Read-Only Mode

When `BUSINESSMAP_READ_ONLY_MODE=true`, only tools marked ✅ in the "Read-Only Safe" column are registered. Write operations (❌) are not available. This is useful for:

- Safe data exploration without risk of modifications
- Granting read-only access to AI assistants
- Auditing and reporting use cases

> Note: All 5 resources and all 4 prompts are available regardless of read-only mode setting.
