import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EntityId, ForumReply, ForumTopic } from '../models/entities';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ForumService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listTopics() {
    // NOTE: The current backend returns an empty array for the `_sort/_order` query.
    // We keep sorting client-side in the page component.
    return this.http.get<ForumTopic[]>(`${this.baseUrl}/forumTopics`);
  }

  getTopicById(topicId: EntityId) {
    return this.http.get<ForumTopic>(`${this.baseUrl}/forumTopics/${topicId}`);
  }

  createTopic(payload: Omit<ForumTopic, 'id'>) {
    return this.http.post<ForumTopic>(`${this.baseUrl}/forumTopics`, payload);
  }

  updateTopic(topicId: EntityId, payload: Partial<ForumTopic>) {
    return this.http.patch<ForumTopic>(`${this.baseUrl}/forumTopics/${topicId}`, payload);
  }

  deleteTopic(topicId: EntityId) {
    return this.http.delete<void>(`${this.baseUrl}/forumTopics/${topicId}`);
  }

  listReplies() {
    // NOTE: The current backend treats `_sort/_order` as regular filter fields and returns an empty array.
    // We fetch and filter/sort client-side.
    return this.http.get<ForumReply[]>(`${this.baseUrl}/forumReplies`);
  }

  createReply(payload: Omit<ForumReply, 'id'>) {
    return this.http.post<ForumReply>(`${this.baseUrl}/forumReplies`, payload);
  }

  deleteReply(replyId: EntityId) {
    return this.http.delete<void>(`${this.baseUrl}/forumReplies/${replyId}`);
  }
}
