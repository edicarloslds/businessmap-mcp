// Lane/Swimlane Types for BusinessMap API

export interface Swimlane {
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
  color: string;
}
