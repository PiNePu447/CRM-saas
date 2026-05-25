import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Deal, KanbanBoard, Pipeline, PipelineStage } from '../models/deal.models';

export interface CreatePipelineData { name: string; isDefault?: boolean; }
export interface UpdatePipelineData { name?: string; isDefault?: boolean; }
export interface CreateStageData { name: string; probabilityDefault?: number; color?: string; }
export interface UpdateStageData { name?: string; position?: number; probabilityDefault?: number; color?: string; }

@Injectable({ providedIn: 'root' })
export class DealsService {
  private readonly api = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  listPipelines(): Observable<Pipeline[]> {
    return this.http.get<Pipeline[]>(`${this.api}/deals/pipelines`);
  }

  createPipeline(data: CreatePipelineData): Observable<Pipeline> {
    return this.http.post<Pipeline>(`${this.api}/deals/pipelines`, data);
  }

  updatePipeline(id: string, data: UpdatePipelineData): Observable<Pipeline> {
    return this.http.patch<Pipeline>(`${this.api}/deals/pipelines/${id}`, data);
  }

  deletePipeline(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/deals/pipelines/${id}`);
  }

  createStage(pipelineId: string, data: CreateStageData): Observable<PipelineStage> {
    return this.http.post<PipelineStage>(`${this.api}/deals/pipelines/${pipelineId}/stages`, data);
  }

  updateStage(pipelineId: string, stageId: string, data: UpdateStageData): Observable<PipelineStage> {
    return this.http.patch<PipelineStage>(`${this.api}/deals/pipelines/${pipelineId}/stages/${stageId}`, data);
  }

  deleteStage(pipelineId: string, stageId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/deals/pipelines/${pipelineId}/stages/${stageId}`);
  }

  reorderStages(pipelineId: string, stageIds: string[]): Observable<Pipeline> {
    return this.http.patch<Pipeline>(`${this.api}/deals/pipelines/${pipelineId}/stages/reorder`, { stageIds });
  }

  getKanban(pipelineId: string, ownerId?: string): Observable<KanbanBoard> {
    let url = `${this.api}/deals/kanban/${pipelineId}`;
    if (ownerId) url += `?ownerId=${encodeURIComponent(ownerId)}`;
    return this.http.get<KanbanBoard>(url);
  }

  list(pipelineId?: string, stageId?: string, ownerId?: string): Observable<Deal[]> {
    let url = `${this.api}/deals`;
    const params: string[] = [];
    if (pipelineId) params.push(`pipelineId=${pipelineId}`);
    if (stageId) params.push(`stageId=${stageId}`);
    if (ownerId) params.push(`ownerId=${encodeURIComponent(ownerId)}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<Deal[]>(url);
  }

  getById(id: string): Observable<Deal> {
    return this.http.get<Deal>(`${this.api}/deals/${id}`);
  }

  create(data: Partial<Deal> & { contactId: string; pipelineId: string; stageId: string; title: string }): Observable<Deal> {
    return this.http.post<Deal>(`${this.api}/deals`, data);
  }

  update(id: string, data: Partial<Deal>): Observable<Deal> {
    return this.http.patch<Deal>(`${this.api}/deals/${id}`, data);
  }

  move(id: string, stageId: string, position: number, isWon?: boolean, closedReason?: string): Observable<Deal> {
    return this.http.patch<Deal>(`${this.api}/deals/${id}/move`, {
      stageId,
      position,
      isWon,
      closedReason,
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/deals/${id}`);
  }
}
