import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { EntityId, ExerciseEntry } from '../models/entities';
import { environment } from '../../environments/environment';

export type ExerciseUpsert = Omit<ExerciseEntry, 'id'>;

@Injectable({ providedIn: 'root' })
export class ExerciseEntryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/exercises`;

  listByDate(userId: EntityId, date: string) {
    const params = new HttpParams().set('date', date);
    const normalizedUserId = String(userId);
    return this.http.get<ExerciseEntry[]>(this.baseUrl, { params }).pipe(
      map((exercises) => exercises.filter((exercise) => String(exercise.userId) === normalizedUserId)),
    );
  }

  create(payload: ExerciseUpsert) {
    return this.http.post<ExerciseEntry>(this.baseUrl, payload);
  }

  update(id: EntityId, payload: ExerciseUpsert) {
    return this.http.put<ExerciseEntry>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: EntityId) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
