import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EntityId, WaterIntakeEntry } from '../models/entities';
import { environment } from '../../environments/environment';

export type WaterIntakeUpsert = Omit<WaterIntakeEntry, 'id'>;

@Injectable({ providedIn: 'root' })
export class WaterIntakeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/waterIntakeEntries`;

  listAll() {
    return this.http.get<WaterIntakeEntry[]>(this.baseUrl);
  }

  create(payload: WaterIntakeUpsert) {
    return this.http.post<WaterIntakeEntry>(this.baseUrl, payload);
  }

  delete(id: EntityId) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
