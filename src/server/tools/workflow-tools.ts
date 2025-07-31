import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { Card, WorkflowCycleTimeColumn } from '../../types/index.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class WorkflowToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerGetWorkflowCycleTimeColumns(server, client);
    this.registerGetWorkflowEffectiveCycleTimeColumns(server, client);
    this.registerCalculateCardCycleTime(server, client);
    // Test registration with different name
    this.registerTestEffectiveCycleTimeColumns(server, client);
  }

  private registerGetWorkflowCycleTimeColumns(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_workflow_cycle_time_columns',
      {
        title: 'Get Workflow Cycle Time Columns',
        description: "Get workflow's cycle time columns",
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
          workflow_id: z.number().describe('The ID of the workflow'),
        },
      },
      async ({ board_id, workflow_id }) => {
        try {
          const columns = await client.getWorkflowCycleTimeColumns(board_id, workflow_id);
          return createSuccessResponse(columns);
        } catch (error) {
          return createErrorResponse(error, 'fetching workflow cycle time columns');
        }
      }
    );
  }

  private registerGetWorkflowEffectiveCycleTimeColumns(
    server: McpServer,
    client: BusinessMapClient
  ): void {
    server.registerTool(
      'get_workflow_effective_cycle_time_columns',
      {
        title: 'Get Workflow Effective Cycle Time Columns',
        description:
          "Get workflow's effective cycle time columns (the columns actually used for cycle time calculation with applied filters/logic)",
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
          workflow_id: z.number().describe('The ID of the workflow'),
        },
      },
      async ({ board_id, workflow_id }) => {
        try {
          console.log(
            `[DEBUG] Fetching effective cycle time columns for board ${board_id}, workflow ${workflow_id}`
          );
          const columns = await client.getWorkflowEffectiveCycleTimeColumns(board_id, workflow_id);
          console.log(`[DEBUG] Received ${columns.length} effective cycle time columns`);
          return createSuccessResponse(
            columns,
            `Retrieved ${columns.length} effective cycle time columns for board ${board_id}, workflow ${workflow_id}`
          );
        } catch (error) {
          console.error(`[DEBUG] Error fetching effective cycle time columns:`, error);
          return createErrorResponse(error, 'fetching workflow effective cycle time columns');
        }
      }
    );
  }

  private registerCalculateCardCycleTime(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'calculate_card_cycle_time',
      {
        title: 'Calculate Card Cycle Time',
        description:
          'Calculate the cycle time of a specific card based on cycle time columns only, counting BUSINESS DAYS only (excludes weekends). Returns detailed breakdown with business days as primary metric. Optionally includes refinement columns (PARA REFINAMENTO, EM REFINAMENTO, REFINADO) for extended cycle time calculation. Also compares with effective cycle time columns if available.',
        inputSchema: {
          card_id: z.number().describe('The ID of the card to calculate cycle time for'),
          board_id: z
            .number()
            .optional()
            .describe('Optional board ID (will be retrieved from card if not provided)'),
          include_detailed_breakdown: z
            .boolean()
            .optional()
            .default(true)
            .describe('Whether to include detailed breakdown by column'),
          compare_with_effective: z
            .boolean()
            .optional()
            .default(true)
            .describe('Whether to compare with effective cycle time columns'),
          include_refinement_columns: z
            .boolean()
            .optional()
            .default(false)
            .describe(
              'Whether to include refinement columns (PARA REFINAMENTO, EM REFINAMENTO, REFINADO) in cycle time calculation'
            ),
        },
      },
      async ({
        card_id,
        board_id,
        include_detailed_breakdown = true,
        compare_with_effective = true,
        include_refinement_columns = false,
      }) => {
        try {
          // Get card details
          const card = await client.getCard(card_id);

          // Use board_id from card if not provided
          const actualBoardId = board_id || card.board_id;

          // Get cycle time columns for the card's workflow
          let cycleTimeColumns = await client.getWorkflowCycleTimeColumns(
            actualBoardId,
            card.workflow_id
          );

          // If requested, include refinement columns in the cycle time calculation
          if (include_refinement_columns) {
            // Get all columns to find refinement columns
            const allColumns = await client.getColumns(actualBoardId);
            const workflowColumns = allColumns.filter(
              (col) => col.workflow_id === card.workflow_id
            );

            // Find refinement columns by name
            const refinementColumnNames = ['PARA REFINAMENTO', 'EM REFINAMENTO', 'REFINADO'];
            const refinementColumns = workflowColumns.filter((col) =>
              refinementColumnNames.includes(col.name)
            );

            // Add refinement columns to cycle time columns (avoiding duplicates)
            const existingColumnIds = new Set(cycleTimeColumns.map((col) => col.column_id));
            const additionalColumns = refinementColumns
              .filter((col) => col.column_id !== undefined && !existingColumnIds.has(col.column_id))
              .map((col) => ({
                column_id: col.column_id!,
                name: col.name,
              }));

            cycleTimeColumns = [...additionalColumns, ...cycleTimeColumns];
          }

          // Try to get effective cycle time columns for comparison
          let effectiveCycleTimeColumns = null;
          let effectiveColumnsError = null;

          if (compare_with_effective) {
            try {
              effectiveCycleTimeColumns = await client.getWorkflowEffectiveCycleTimeColumns(
                actualBoardId,
                card.workflow_id
              );
            } catch (error) {
              effectiveColumnsError = error instanceof Error ? error.message : 'Unknown error';
            }
          }

          // Calculate cycle time
          const cycleTimeResult = this.calculateCycleTime(
            card,
            cycleTimeColumns,
            include_detailed_breakdown
          );

          // Add comparison with effective columns if available
          if (effectiveCycleTimeColumns) {
            cycleTimeResult.effective_cycle_time_columns = effectiveCycleTimeColumns.map((col) => ({
              column_id: col.column_id,
              column_name: col.name,
              is_current: col.column_id === card.column_id,
              in_regular_cycle_time: cycleTimeColumns.some((c) => c.column_id === col.column_id),
            }));

            const differences = this.compareColumns(cycleTimeColumns, effectiveCycleTimeColumns);
            if (differences.length > 0) {
              cycleTimeResult.column_differences = differences;
            }
          } else if (effectiveColumnsError) {
            cycleTimeResult.effective_columns_error = effectiveColumnsError;
          }

          return createSuccessResponse(
            cycleTimeResult,
            `Cycle time calculated for card ${card_id} in lane ${card.lane_id}`
          );
        } catch (error) {
          return createErrorResponse(error, 'calculating card cycle time');
        }
      }
    );
  }

  private calculateCycleTime(
    card: Card,
    cycleTimeColumns: WorkflowCycleTimeColumn[],
    includeBreakdown: boolean
  ) {
    const cycleTimeColumnIds = new Set(cycleTimeColumns.map((col) => col.column_id));

    // Check if current column is in cycle time
    const isCurrentColumnInCycle = cycleTimeColumnIds.has(card.column_id);
    const currentColumn = cycleTimeColumns.find((col) => col.column_id === card.column_id);

    // Get current time
    const now = new Date();

    // Calculate basic cycle time metrics
    let cycleStartTime: Date | null = null;
    let cycleEndTime: Date | null = null;

    // ENHANCED LOGIC: Determine most accurate cycle start time
    // The BusinessMap API sometimes has inconsistent timestamps
    // We need to find the most logical start time for the current cycle

    // Check if refinement columns are included to decide on start time strategy
    const includesRefinement = cycleTimeColumns.some((col) =>
      ['PARA REFINAMENTO', 'EM REFINAMENTO', 'REFINADO'].includes(col.name)
    );

    if (includesRefinement && card.first_start_time) {
      // When including refinement columns, use first_start_time to capture the entire journey
      cycleStartTime = new Date(card.first_start_time);
    } else if (card.last_start_time && card.last_start_time !== card.first_start_time) {
      // Use last_start_time if it represents a real restart in the workflow
      cycleStartTime = new Date(card.last_start_time);
    } else if (card.first_start_time) {
      // Use first_start_time if it's the only start time available
      cycleStartTime = new Date(card.first_start_time);
    } else {
      // Fallback to created_at
      cycleStartTime = new Date(card.created_at);
    }

    // ENHANCED LOGIC: Determine end time with better logic
    // For cards still in cycle columns, use current time
    // For cards that completed the cycle, use the most recent relevant timestamp
    if (isCurrentColumnInCycle) {
      // Card is still in a cycle column, so it's still in progress
      cycleEndTime = now;
    } else if (card.last_end_time && card.last_end_time !== card.first_end_time) {
      // Card completed and moved out of cycle
      cycleEndTime = new Date(card.last_end_time);
    } else {
      // Card might have moved out recently, use current time
      cycleEndTime = now;
    }

    let totalCycleTimeMs = 0;
    let totalCycleTimeDays = 0;
    let totalCycleTimeHours = 0;
    let totalCycleTimeMinutes = 0;

    if (cycleStartTime && cycleEndTime) {
      totalCycleTimeMs = cycleEndTime.getTime() - cycleStartTime.getTime();
      totalCycleTimeMinutes = Math.floor(totalCycleTimeMs / (1000 * 60));
      totalCycleTimeHours = Math.floor(totalCycleTimeMs / (1000 * 60 * 60));
      totalCycleTimeDays = Math.floor(totalCycleTimeMs / (1000 * 60 * 60 * 24));
    }

    // Calculate working days (business days only, excluding weekends)
    const workingDays = this.calculateBusinessDays(cycleStartTime, cycleEndTime);
    const businessHours = this.calculateBusinessHours(cycleStartTime, cycleEndTime);

    const result: any = {
      card_id: card.card_id,
      card_title: card.title,
      board_id: card.board_id,
      workflow_id: card.workflow_id,
      lane_id: card.lane_id,
      current_column_id: card.column_id,
      current_column_name: currentColumn?.name || 'Unknown',
      is_current_column_in_cycle: isCurrentColumnInCycle,
      cycle_status: isCurrentColumnInCycle ? 'IN_CYCLE' : 'NOT_IN_CYCLE',

      cycle_time: {
        start_time: cycleStartTime?.toISOString() || null,
        end_time: cycleEndTime?.toISOString() || null,
        is_completed: !isCurrentColumnInCycle,

        // Primary metrics (business days only)
        business_days: workingDays,
        business_hours: businessHours,

        // Secondary metrics (calendar time for reference)
        calendar_days: totalCycleTimeDays,
        calendar_hours: totalCycleTimeHours,
        calendar_minutes: totalCycleTimeMinutes,
        calendar_weeks: Math.floor(totalCycleTimeDays / 7),

        formatted_business_time: `${workingDays} business day${workingDays !== 1 ? 's' : ''} (${businessHours} business hours)`,
        formatted_calendar_time: this.formatDuration(totalCycleTimeMinutes),
      },

      cycle_time_columns: cycleTimeColumns.map((col) => ({
        column_id: col.column_id,
        column_name: col.name,
        is_current: col.column_id === card.column_id,
      })),

      card_timestamps: {
        created_at: card.created_at,
        first_start_time: card.first_start_time,
        last_start_time: card.last_start_time,
        first_end_time: card.first_end_time,
        last_end_time: card.last_end_time,
        in_current_position_since: card.in_current_position_since,
        last_modified: card.last_modified,
      },
    };

    if (includeBreakdown) {
      const includesRefinement = cycleTimeColumns.some((col) =>
        ['PARA REFINAMENTO', 'EM REFINAMENTO', 'REFINADO'].includes(col.name)
      );

      const startTimeNote = includesRefinement
        ? 'Start time: Uses first_start_time to capture entire journey including refinement'
        : 'Start time: Uses last_start_time if different from first_start_time, otherwise first_start_time';

      const refinementNote = includesRefinement
        ? 'INCLUDES refinement columns (PARA REFINAMENTO, EM REFINAMENTO, REFINADO) in cycle time calculation'
        : 'EXCLUDES refinement columns - use include_refinement_columns=true to include them';

      result.notes = [
        'ENHANCED CALCULATION: Intelligent cycle time calculation handling BusinessMap API data inconsistencies',
        startTimeNote,
        'End time: For cards in cycle uses current time, for completed cards uses most relevant timestamp',
        refinementNote,
        'PRIMARY METRIC: business_days excludes weekends (Saturday/Sunday)',
        'Business hours assumes 8 hours per business day',
        'Calendar time provided for reference but should not be used for cycle time reporting',
        'This enhanced logic provides better alignment with BusinessMap web interface',
        isCurrentColumnInCycle
          ? 'Card is currently IN a cycle time column - time still counting'
          : 'Card is NOT in a cycle time column - cycle completed or paused',
      ];
    }

    return result;
  }

  private calculateBusinessDays(startDate: Date | null, endDate: Date | null): number {
    if (!startDate || !endDate) return 0;

    let businessDays = 0;
    const currentDate = new Date(startDate);

    // Normalize to start of day for accurate day counting
    currentDate.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return businessDays;
  }

  private calculateBusinessHours(startDate: Date | null, endDate: Date | null): number {
    if (!startDate || !endDate) return 0;

    const businessDays = this.calculateBusinessDays(startDate, endDate);

    // Assuming 8 business hours per business day
    // This is a simplified calculation - could be enhanced with actual business hours
    return businessDays * 8;
  }

  private formatDuration(totalMinutes: number): string {
    if (totalMinutes === 0) return '0 minutes';

    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

    return parts.join(', ');
  }

  private compareColumns(
    regularColumns: WorkflowCycleTimeColumn[],
    effectiveColumns: WorkflowCycleTimeColumn[]
  ): string[] {
    const differences: string[] = [];

    // Find columns in regular but not in effective
    const onlyInRegular = regularColumns.filter(
      (reg) => !effectiveColumns.some((eff) => eff.column_id === reg.column_id)
    );

    // Find columns in effective but not in regular
    const onlyInEffective = effectiveColumns.filter(
      (eff) => !regularColumns.some((reg) => reg.column_id === eff.column_id)
    );

    if (onlyInRegular.length > 0) {
      differences.push(
        `Columns in regular cycle time but NOT in effective: ${onlyInRegular.map((c) => c.name).join(', ')}`
      );
    }

    if (onlyInEffective.length > 0) {
      differences.push(
        `Columns in effective cycle time but NOT in regular: ${onlyInEffective.map((c) => c.name).join(', ')}`
      );
    }

    if (
      regularColumns.length === effectiveColumns.length &&
      onlyInRegular.length === 0 &&
      onlyInEffective.length === 0
    ) {
      differences.push('✅ Regular and effective cycle time columns are identical');
    }

    return differences;
  }

  // Test method to debug the effective cycle time columns issue
  private registerTestEffectiveCycleTimeColumns(
    server: McpServer,
    client: BusinessMapClient
  ): void {
    server.registerTool(
      'test_effective_cycle_time_columns',
      {
        title: 'TEST: Get Workflow Effective Cycle Time Columns',
        description: "TEST version of get workflow's effective cycle time columns",
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
          workflow_id: z.number().describe('The ID of the workflow'),
        },
      },
      async ({ board_id, workflow_id }) => {
        try {
          console.log(
            `[TEST] Trying to fetch effective cycle time columns for board ${board_id}, workflow ${workflow_id}`
          );
          const columns = await client.getWorkflowEffectiveCycleTimeColumns(board_id, workflow_id);
          console.log(`[TEST] Success! Received ${columns.length} effective cycle time columns`);
          return createSuccessResponse(
            columns,
            `TEST: Retrieved ${columns.length} effective cycle time columns`
          );
        } catch (error) {
          console.error(`[TEST] Error:`, error);
          return createErrorResponse(error, 'TEST: fetching workflow effective cycle time columns');
        }
      }
    );
  }
}
