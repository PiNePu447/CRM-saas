import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Deal, KanbanBoard, Pipeline } from '../models/deal.models';

@Injectable({ providedIn: 'root' })
export class DealsService {
  private readonly api = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  listPipelines(): Observable<Pipeline[]> {
    return this.http.get<Pipeline[]>(`${this.api}/deals/pipelines`);
  }

  getKanban(pipelineId: string): Observable<KanbanBoard> {
    return this.http.get<KanbanBoard>(`${this.api}/deals/kanban/${pipelineId}`);
  }

  list(pipelineId?: string, stageId?: string): Observable<Deal[]> {
    let url = `${this.api}/deals`;
    const params: string[] = [];
    if (pipelineId) params.push(`pipelineId=${pipelineId}`);
    if (stageId) params.push(`stageId=${stageId}`);
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
