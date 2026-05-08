import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserProfile } from '../../models/entities';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-page',
  template: `
    <div class="page-container profile-page">
      <header class="profile-header">
        <h1>Profil</h1>
        <p class="profile-subtitle">A fiókod adatai.</p>
      </header>

      @if (loading()) {
        <section class="card">
          <p class="card-text">Betöltés folyamatban...</p>
        </section>
      } @else if (error()) {
        <section class="card" aria-live="assertive">
          <p class="card-text profile-error">{{ error() }}</p>
        </section>
      } @else if (!profile()) {
        <section class="card">
          <p class="card-text">Nincs profil adat.</p>
        </section>
      } @else {
        <section class="card" aria-label="Profil adatok">
          <h2 class="card-title">{{ profile()!.displayName }}</h2>
          <p class="card-text">Email: {{ profile()!.email }}</p>
          <p class="card-text">Napi kalória cél: {{ profile()!.dailyCalorieTarget }} kcal</p>
          <p class="card-text">Napi vízcél: {{ profile()!.waterDailyTargetMl }} ml</p>
          <p class="card-text">Pohár méret: {{ profile()!.waterGlassSizeMl }} ml</p>
        </section>
      }
    </div>
  `,
  styleUrls: ['./profile.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  private readonly userProfileService = inject(UserProfileService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly profile = signal<UserProfile | null>(null);

  constructor() {
    this.loadProfile();
  }

  private loadProfile(): void {
    const userId = this.auth.userId();
    if (!this.auth.isAuthenticated() || !userId) {
      this.loading.set(false);
      this.error.set('A profil megtekintéséhez bejelentkezés szükséges.');
      this.profile.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.userProfileService.getById(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('A profil betöltése sikertelen.');
          this.loading.set(false);
        },
      });
  }
}
