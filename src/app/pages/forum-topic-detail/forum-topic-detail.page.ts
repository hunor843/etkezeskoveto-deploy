import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { EntityId, ForumReply, ForumTopic } from '../../models/entities';
import { ForumService } from '../../services/forum.service';
import { ToastService } from '../../toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forum-topic-detail-page',
  templateUrl: './forum-topic-detail.page.html',
  styleUrls: ['./forum-topic-detail.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, ReactiveFormsModule],
})
export class ForumTopicDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly forumService = inject(ForumService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);

  protected readonly topic = signal<ForumTopic | null>(null);
  protected readonly replies = signal<ForumReply[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submittingReply = signal(false);
  protected readonly deletingTopic = signal(false);
  protected readonly deletingReplyId = signal<EntityId | null>(null);

  protected readonly replyForm = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadTopic());
  }

  protected isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  protected canDeleteTopic(topic: ForumTopic): boolean {
    if (!this.isLoggedIn()) {
      return false;
    }

    const user = this.auth.user();
    const userId = this.auth.userId();
    if (!userId) {
      return false;
    }

    return user?.role === 'admin' || String(topic.authorUserId) === String(userId);
  }

  protected deleteTopic(): void {
    const currentTopic = this.topic();
    if (!currentTopic) {
      return;
    }

    if (!this.canDeleteTopic(currentTopic)) {
      this.toast.show('Nincs jogosultságod a téma törléséhez.');
      return;
    }

    const ok = window.confirm('Biztosan törlöd ezt a témát?');
    if (!ok) {
      return;
    }

    this.deletingTopic.set(true);
    this.forumService.deleteTopic(currentTopic.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingTopic.set(false);
          this.toast.show('Téma törölve.');
          this.router.navigate(['/forum']);
        },
        error: () => {
          this.deletingTopic.set(false);
          this.toast.show('A téma törlése sikertelen.');
        },
      });
  }

  protected canDeleteReply(reply: ForumReply): boolean {
    if (!this.isLoggedIn()) {
      return false;
    }

    const user = this.auth.user();
    const userId = this.auth.userId();
    if (!userId) {
      return false;
    }

    return user?.role === 'admin' || String(reply.authorUserId) === String(userId);
  }

  protected deleteReply(reply: ForumReply): void {
    if (!this.canDeleteReply(reply)) {
      this.toast.show('Nincs jogosultságod a hozzászólás törléséhez.');
      return;
    }

    const ok = window.confirm('Biztosan törlöd ezt a hozzászólást?');
    if (!ok) {
      return;
    }

    const currentTopic = this.topic();
    const nextReplyCount = Math.max(0, (currentTopic?.replyCount ?? this.replies().length) - 1);

    this.deletingReplyId.set(reply.id);
    this.forumService.deleteReply(reply.id)
      .pipe(
        switchMap(() => {
          if (!currentTopic) {
            return of(null);
          }
          return this.forumService.updateTopic(currentTopic.id, {
            replyCount: nextReplyCount,
            updatedAt: new Date().toISOString(),
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updatedTopic) => {
          this.replies.set(this.replies().filter((r) => String(r.id) !== String(reply.id)));
          if (updatedTopic) {
            this.topic.set(updatedTopic);
          }
          this.deletingReplyId.set(null);
          this.toast.show('Hozzászólás törölve.');
        },
        error: () => {
          this.deletingReplyId.set(null);
          this.toast.show('A hozzászólás törlése sikertelen.');
        },
      });
  }

  protected hasReplyFieldError(): boolean {
    const control = this.replyForm.controls.body;
    return control.invalid && (control.touched || control.dirty);
  }

  protected submitReply(): void {
    if (!this.isLoggedIn()) {
      this.toast.show('Hozzászólni csak bejelentkezett felhasználó tud.');
      return;
    }

    const currentTopic = this.topic();
    if (!currentTopic) {
      this.toast.show('A téma még nem érhető el.');
      return;
    }

    if (this.replyForm.invalid) {
      this.replyForm.markAllAsTouched();
      return;
    }

    const now = new Date().toISOString();
    const body = this.replyForm.controls.body.getRawValue().trim();
    const replyPayload: Omit<ForumReply, 'id'> = {
      topicId: currentTopic.id,
      authorUserId: this.auth.userId() ?? 'guest',
      content: body,
      body,
      createdAt: now,
      updatedAt: now,
      isEdited: false,
    };

    const nextReplyCount = (currentTopic.replyCount ?? 0) + 1;
    this.submittingReply.set(true);
    this.forumService.createReply(replyPayload)
      .pipe(
        switchMap((createdReply) =>
          this.forumService.updateTopic(currentTopic.id, {
            replyCount: nextReplyCount,
            updatedAt: now,
          }).pipe(map((updatedTopic) => ({ createdReply, updatedTopic }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ createdReply, updatedTopic }) => {
          this.topic.set(updatedTopic);
          this.replies.set([...this.replies(), createdReply]);
          this.submittingReply.set(false);
          this.replyForm.reset({ body: '' });
          this.toast.show('Hozzászólás mentve.');
        },
        error: () => {
          this.submittingReply.set(false);
          this.toast.show('A hozzászólás mentése sikertelen.');
        },
      });
  }

  private loadTopic(): void {
    const topicId = this.route.snapshot.paramMap.get('topicId');
    if (!topicId) {
      this.error.set('Érvénytelen topic azonosító.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      topic: this.forumService.getTopicById(topicId),
      replies: this.forumService.listReplies(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ topic, replies }) => {
          const normalizedTopicId = String(topicId);
          const filteredAndSortedReplies = (replies ?? [])
            .filter((reply) => String(reply.topicId) === normalizedTopicId)
            .sort((a, b) => {
              const aTimestamp = Date.parse(a.createdAt ?? a.updatedAt ?? '1970-01-01T00:00:00.000Z');
              const bTimestamp = Date.parse(b.createdAt ?? b.updatedAt ?? '1970-01-01T00:00:00.000Z');
              return aTimestamp - bTimestamp;
            });

          this.topic.set(topic);
          this.replies.set(filteredAndSortedReplies);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('A topic betöltése sikertelen.');
          this.loading.set(false);
        },
      });
  }
}
