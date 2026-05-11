export interface Pipeline {
  id: string;
  name: string;
  isDefault: boolean;
  stages: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  position: number;
  probabilityDefault: number;
  color: string;
}

export interface Deal {
  id: string;
  title: string;
  value?: number;
  probability: number;
  expectedCloseDate?: string;
  position: number;
  closedAt?: string;
  isWon?: boolean;
  closedReason?: string;
  contact: { id: string; name: string; email?: string };
  owner: { id: string; name: string };
  stage: PipelineStage;
  pipeline: { id: string; name: string };
  createdAt: string;
}

export interface KanbanStage extends PipelineStage {
  deals: Deal[];
  totalValue: number;
}

export interface KanbanBoard {
  pipeline: { id: string; name: string };
  stages: KanbanStage[];
}
