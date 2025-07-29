// Analytics Types for BusinessMap API

export interface CycleTimeColumn {
  column_id: number;
  column_name: string;
  board_id: number;
  position: number;
  is_start_column: boolean;
  is_end_column: boolean;
  cycle_time_data?: {
    average_days: number;
    min_days: number;
    max_days: number;
    total_cards: number;
  };
}

export interface EffectiveCycleTimeColumn {
  column_id: number;
  column_name: string;
  board_id: number;
  position: number;
  is_effective_start: boolean;
  is_effective_end: boolean;
  exclude_weekends: boolean;
  exclude_holidays: boolean;
  effective_cycle_time_data?: {
    average_hours: number;
    min_hours: number;
    max_hours: number;
    total_cards: number;
    business_hours_only: boolean;
  };
}
