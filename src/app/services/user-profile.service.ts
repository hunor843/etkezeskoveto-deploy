import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EntityId, UserProfile } from '../models/entities';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users`;

  getById(id: EntityId) {
    return this.http.get<UserProfile>(`${this.baseUrl}/${id}`);
  }

  updatePartial(id: EntityId, payload: Partial<UserProfile>) {
    return this.http.patch<UserProfile>(`${this.baseUrl}/${id}`, payload);
  }
}
