import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EntityId, ForumTopic } from '../../models/entities';
import { ForumService } from '../../services/forum.service';
import { ToastService } from '../../toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forum-page',
  templateUrl: './forum.page.html',
  styleUrls: ['./forum.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, ReactiveFormsModule],
})
export class ForumPageComponent {
  private readonly forumService = inject(ForumService);
  private readonly fb = inject(FormBuilder);
  protected readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);

  protected readonly allTopics = signal<ForumTopic[]>([]);
  protected readonly topics = computed(() => {
    const normalizedTerm = this.normalizeText(this.searchTerm());
    const source = this.allTopics();

    if (!normalizedTerm) {
      return source;
    }

    return source.filter((topic) => {
      const title = this.normalizeText(topic.title ?? '');
      const body = this.normalizeText(topic.body ?? '');
      return title.includes(normalizedTerm) || body.includes(normalizedTerm);
    });
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly creatingTopic = signal(false);
  protected readonly deletingTopicId = signal<EntityId | null>(null);

  protected readonly topicCreateForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    body: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor() {
    this.loadTopics();
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
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

  protected deleteTopic(topic: ForumTopic, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.canDeleteTopic(topic)) {
      this.toast.show('Nincs jogosultságod a téma törléséhez.');
      return;
    }

    const ok = window.confirm('Biztosan törlöd ezt a témát?');
    if (!ok) {
      return;
    }

    this.deletingTopicId.set(topic.id);
    this.forumService.deleteTopic(topic.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.allTopics.set(this.allTopics().filter((t) => String(t.id) !== String(topic.id)));
          this.deletingTopicId.set(null);
          this.toast.show('Téma törölve.');
        },
        error: () => {
          this.deletingTopicId.set(null);
          this.toast.show('A téma törlése sikertelen.');
        },
      });
  }

  protected hasCreateFieldError(fieldName: 'title' | 'body'): boolean {
    const control = this.topicCreateForm.controls[fieldName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submitTopic(): void {
    if (!this.isLoggedIn()) {
      this.toast.show('Új témát csak bejelentkezett felhasználó hozhat létre.');
      return;
    }

    if (this.topicCreateForm.invalid) {
      this.topicCreateForm.markAllAsTouched();
      return;
    }

    const now = new Date().toISOString();
    const value = this.topicCreateForm.getRawValue();
    const payload = {
      title: value.title.trim(),
      body: value.body.trim(),
      authorUserId: this.auth.userId() ?? 'guest',
      updatedAt: now,
      replyCount: 0,
      createdAt: now,
      isLocked: false,
    };

    this.creatingTopic.set(true);
    this.forumService.createTopic(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdTopic) => {
          this.creatingTopic.set(false);
          this.topicCreateForm.reset({ title: '', body: '' });
          this.toast.show('Új fórumtéma létrehozva.');
          this.router.navigate(['/forum', createdTopic.id]);
        },
        error: () => {
          this.creatingTopic.set(false);
          this.toast.show('A fórumtéma létrehozása sikertelen.');
        },
      });
  }

  private loadTopics(): void {
    this.loading.set(true);
    this.error.set(null);

    this.forumService.listTopics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (topics) => {
          const sorted = [...topics].sort((a, b) => {
            const aTimestamp = Date.parse(a.updatedAt ?? a.createdAt ?? '1970-01-01T00:00:00.000Z');
            const bTimestamp = Date.parse(b.updatedAt ?? b.createdAt ?? '1970-01-01T00:00:00.000Z');
            return bTimestamp - aTimestamp;
          });

          this.allTopics.set(sorted);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('A fórum témák betöltése sikertelen.');
          this.loading.set(false);
        },
      });
  }

  private normalizeText(value: string): string {
    return value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('hu-HU');
  }
}
