import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { EntityId, MealEntry } from '../models/entities';
import { environment } from '../../environments/environment';

export type MealUpsert = Omit<MealEntry, 'id'>;

@Injectable({ providedIn: 'root' })
export class MealService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/meals`;

  listByDate(userId: EntityId, date: string) {
    const params = new HttpParams().set('date', date);
    const normalizedUserId = String(userId);
    return this.http.get<MealEntry[]>(this.baseUrl, { params }).pipe(
      map((meals) => meals.filter((meal) => String(meal.userId) === normalizedUserId)),
    );
  }

  create(payload: MealUpsert) {
    return this.http.post<MealEntry>(this.baseUrl, payload);
  }

  update(id: EntityId, payload: MealUpsert) {
    return this.http.put<MealEntry>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: EntityId) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
