// Lane Types for BusinessMap API

export interface Lane {
  lane_id?: number;
  workflow: number;
  position: number;
  name: string;
  description: string;
  color: string;
}

export interface CreateLaneParams {
  workflow_id: number;
  position: number;
  name: string;
  description?: string | null;
  color?: string;
  parent_lane_id?: number;
}

export interface UpdateLaneParams {
  name?: string;
  description?: string | null;
  color?: string;
  position?: number;
  parent_lane_id?: number;
}
