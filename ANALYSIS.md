# BusinessMap MCP Fork — Analysis (Research Brief)

**Karte:** #228 auf Board 5
**Auftraggeber:** Klaus (Flight Levels Coach)
**Datum:** 2026-02-23

## Bestandsaufnahme

### Existierende Tools (42)

| Modul | Tools | Status |
|-------|-------|--------|
| board-tools | list_boards, search_board, get_columns, get_lanes, get_lane, create_board, create_lane, get_current_board_structure | ✅ Solide |
| card-tools | list_cards, get_card, get_card_size, create_card, move_card, update_card, set_card_size, get_card_comments, get_card_comment, get_card_custom_fields, get_card_types, get_card_history, get_card_outcomes, get_card_linked_cards, get_card_subtasks, get_card_subtask, create_card_subtask, get_card_parents, get_card_parent, add_card_parent, remove_card_parent, get_card_parent_graph, get_card_children | ✅ Read-heavy, Write-gaps |
| custom-field-tools | get_custom_field | ⚠️ Minimal |
| user-tools | list_users, get_user, get_current_user | ✅ OK |
| utility-tools | health_check, get_api_info | ✅ OK |
| workflow-tools | get_workflow_cycle_time_columns, get_workflow_effective_cycle_time_columns | ✅ Read-only |
| workspace-tools | list_workspaces, get_workspace, create_workspace | ✅ OK |

### OpenAPI Spec: 384 Endpoints total

## Priorisierung für BMAD v2

### P1 — KRITISCH (Day 1 Needs)

Diese brauchen wir JETZT um den BMAD-Workflow zu betreiben:

| # | Endpoint | Warum | Komplexität |
|---|----------|-------|-------------|
| 1 | **block_card** (PUT /cards/{id}/blockReason) | Correct-Course Pattern: Bugs blocken Originalkarte | Einfach |
| 2 | **unblock_card** (DELETE /cards/{id}/blockReason) | Entblocken nach Bug-Fix | Einfach |
| 3 | **create_comment** (POST /cards/{id}/comments) | Board-Walk Notizen, Status-Updates, Agent-Kommunikation | Einfach |
| 4 | **update_comment** (PATCH /cards/{id}/comments/{id}) | Kommentare korrigieren | Einfach |
| 5 | **delete_comment** (DELETE /cards/{id}/comments/{id}) | Aufräumen | Einfach |
| 6 | **add_tag_to_card** (PUT /cards/{id}/tags/{id}) | Kategorisierung | Einfach |
| 7 | **remove_tag_from_card** (DELETE /cards/{id}/tags/{id}) | Tag-Management | Einfach |
| 8 | **create_tag** (POST /tags) | Tags erstellen (braucht `label` Feld!) | Einfach |
| 9 | **add_sticker** (POST /cards/{id}/stickers) | Visuelle Marker (Risk, Research) | Einfach |
| 10 | **remove_sticker** (DELETE /cards/{id}/stickers/{id}) | Sticker entfernen | Einfach |

### P2 — WICHTIG (Week 1)

| # | Endpoint | Warum | Komplexität |
|---|----------|-------|-------------|
| 11 | **create_column** (POST /boards/{id}/columns) | Board-Aufbau automatisieren | Mittel |
| 12 | **update_column** (PATCH /boards/{id}/columns/{id}) | WIP-Limits anpassen, umbenennen | Mittel |
| 13 | **delete_column** (DELETE /boards/{id}/columns/{id}) | Board-Redesign | Einfach |
| 14 | **delete_card** (DELETE /cards/{id}) | Aufräumen | Einfach |
| 15 | **invite_user** (POST /users/invite) | Onboarding | Mittel |
| 16 | **add_predecessor** (PUT /cards/{id}/predecessors/{id}) | Abhängigkeiten | Einfach |
| 17 | **remove_predecessor** (DELETE /cards/{id}/predecessors/{id}) | Abhängigkeiten lösen | Einfach |

### P3 — NICE-TO-HAVE (Week 2+)

| # | Endpoint | Warum | Komplexität |
|---|----------|-------|-------------|
| 18 | **search_cards** (POST /openSearch/cards) | Volltextsuche | Mittel |
| 19 | **create_many_cards** (POST /cards/createMany) | Batch-Erstellung | Mittel |
| 20 | **update_many_cards** (POST /cards/updateMany) | Batch-Updates | Mittel |
| 21 | **delete_many_cards** (POST /cards/deleteMany) | Batch-Löschung | Einfach |
| 22 | **add_card_watcher** (PUT /cards/{id}/watchers/{id}) | Benachrichtigungen | Einfach |
| 23 | **create_card_type** (POST /cardTypes) | Card Type Management | Einfach |
| 24 | **update_card_type** (PATCH /cardTypes/{id}) | Card Type ändern | Einfach |
| 25 | **delete_card_type** (DELETE /cardTypes/{id}) | Card Type löschen | Einfach |
| 26 | **create_webhook** (POST /webhooks) | Push statt Poll | Mittel |
| 27 | **add_co_owner** (PUT /cards/{id}/coOwners/{id}) | Co-Ownership | Einfach |

## Code-Architektur (bestehendes Pattern)

Für jedes neue Tool braucht man:
1. **Type** in `src/types/` (Interface + Response-Types)
2. **Client Method** in `src/client/modules/` (API-Call)
3. **Schema** in `src/schemas/` (Zod-Validation)
4. **Tool Registration** in `src/server/tools/` (registerTool mit Handler)

### Pattern-Beispiel: Ein neues Tool hinzufügen

```typescript
// 1. src/types/card.ts — add interface
export interface BlockReasonParams {
  card_id: number;
  reason: string;
}

// 2. src/client/modules/card-client.ts — add method
async blockCard(cardId: number, reason: string): Promise<ApiResponse<any>> {
  return this.put(`/cards/${cardId}/blockReason`, { reason });
}

// 3. src/schemas/card-schemas.ts — add schema
export const BlockCardSchema = z.object({
  card_id: z.number().describe('The card ID to block'),
  reason: z.string().describe('The reason for blocking'),
});

// 4. src/server/tools/card-tools.ts — register tool
server.registerTool('block_card', {...}, async (params) => {...});
```

## Empfehlung: Implementierungsreihenfolge

**Sprint 1 (P1):** block/unblock, comments CRUD, tags, stickers → 10 Tools
**Sprint 2 (P2):** columns CRUD, delete_card, invite_user, predecessors → 7 Tools  
**Sprint 3 (P3):** search, batch ops, card types, webhooks → 10 Tools

## Fork-Repo

https://github.com/Milofax/businessmap-mcp
