import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserProfile, GoalType } from '../../models/entities';
import { ToastService } from '../../toast.service';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  protected readonly darkModeEnabled = signal(false);
  protected readonly highContrastEnabled = signal(false);
	protected readonly reduceMotionEnabled = signal(false);
  protected readonly waterTargetMl = signal(2000);
  protected readonly waterGlassSizeMl = signal(250);
  protected readonly weightKg = signal<number | null>(null);
  protected readonly heightCm = signal<number | null>(null);
  protected readonly age = signal<number | null>(null);
  protected readonly goalType = signal<GoalType>('maintain');

  private readonly userProfileService = inject(UserProfileService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly auth = inject(AuthService);

  private profilePatchTimeoutId: number | null = null;
  private pendingProfilePatch: Partial<UserProfile> = {};

  constructor() {
  const isRegisteredUser = this.auth.isAuthenticated();

  // Induláskor igazítsuk a checkboxokat az aktuális (esetleg elmentett) témához
  const root = document.documentElement;
  let currentTheme = root.getAttribute('data-theme');
  let currentContrast = root.getAttribute('data-contrast');
  let currentReduceMotion = root.getAttribute('data-reduce-motion') === 'true';

  // Víz beállítások átvétele korábbi munkamenetből (ha vannak DOM attribútumok)
  const attrWaterTarget = root.getAttribute('data-water-target-ml');
  const attrWaterGlass = root.getAttribute('data-water-glass-ml');
  if (attrWaterTarget) {
    const parsed = Number(attrWaterTarget);
    if (Number.isFinite(parsed) && parsed > 0) {
      this.waterTargetMl.set(Math.round(parsed));
    }
  }
  if (attrWaterGlass) {
    const parsed = Number(attrWaterGlass);
    if (Number.isFinite(parsed) && parsed > 0) {
      this.waterGlassSizeMl.set(Math.round(parsed));
    }
  }

  if (isRegisteredUser) {
    const rawPrefs = localStorage.getItem('macroTrackerPrefs');
    if (rawPrefs) {
      try {
        const prefs = JSON.parse(rawPrefs) as {
          theme?: 'light' | 'dark';
          contrast?: 'normal' | 'high';
          reduceMotion?: boolean;
          waterTargetMl?: number;
          waterGlassSizeMl?: number;
        } | null;
        if (prefs) {
          if (prefs.theme) {
            currentTheme = prefs.theme;
            root.setAttribute('data-theme', prefs.theme);
          }
          if (prefs.contrast) {
            currentContrast = prefs.contrast;
            root.setAttribute('data-contrast', prefs.contrast);
          }
          if (typeof prefs.reduceMotion === 'boolean') {
            currentReduceMotion = prefs.reduceMotion;
            if (prefs.reduceMotion) {
              root.setAttribute('data-reduce-motion', 'true');
            } else {
              root.removeAttribute('data-reduce-motion');
            }
          }
          if (
            typeof prefs.waterTargetMl === 'number' &&
            prefs.waterTargetMl > 0
          ) {
            this.waterTargetMl.set(prefs.waterTargetMl);
          }
          if (
            typeof prefs.waterGlassSizeMl === 'number' &&
            prefs.waterGlassSizeMl > 0
          ) {
            this.waterGlassSizeMl.set(prefs.waterGlassSizeMl);
          }
        }
      } catch {
        // Hibás JSON esetén hagyjuk az aktuális DOM értékeket.
      }
    }
  }

  const isDark = currentTheme === 'dark';
  this.darkModeEnabled.set(isDark);

  const isHighContrast = currentContrast === 'high';
  this.highContrastEnabled.set(isHighContrast);

  this.reduceMotionEnabled.set(currentReduceMotion);

  const userId = this.auth.userId();
  if (isRegisteredUser && userId) {
    this.userProfileService.getById(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          if (typeof profile.waterDailyTargetMl === 'number' && profile.waterDailyTargetMl > 0) {
            this.waterTargetMl.set(Math.round(profile.waterDailyTargetMl));
            root.setAttribute('data-water-target-ml', String(Math.round(profile.waterDailyTargetMl)));
          }
          if (typeof profile.waterGlassSizeMl === 'number' && profile.waterGlassSizeMl > 0) {
            this.waterGlassSizeMl.set(Math.round(profile.waterGlassSizeMl));
            root.setAttribute('data-water-glass-ml', String(Math.round(profile.waterGlassSizeMl)));
          }

          if (typeof profile.weightKg === 'number') {
            this.weightKg.set(profile.weightKg);
          }
          if (typeof profile.heightCm === 'number') {
            this.heightCm.set(profile.heightCm);
          }
          if (typeof profile.age === 'number') {
            this.age.set(profile.age);
          }
          if (profile.goalType) {
            this.goalType.set(profile.goalType);
          }
        },
        error: () => {
          this.toast.show('Nem sikerült betölteni a felhasználói beállításokat.');
        },
      });
  }
  }

  onDarkModeToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.darkModeEnabled.set(checked);
    const root = document.documentElement;
    root.setAttribute('data-theme', checked ? 'dark' : 'light');

  if (this.isRegisteredUser()) {
    this.savePreferences(checked ? 'dark' : 'light', null, null, null, null);
  }
  }

  onHighContrastToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.highContrastEnabled.set(checked);
    const root = document.documentElement;
  const contrast = checked ? 'high' : 'normal';
  root.setAttribute('data-contrast', contrast);

  if (this.isRegisteredUser()) {
    this.savePreferences(null, contrast, null, null, null);
  }
  }

    onReduceMotionToggle(event: Event): void {
      const checked = (event.target as HTMLInputElement).checked;
      this.reduceMotionEnabled.set(checked);
      const root = document.documentElement;
      if (checked) {
        root.setAttribute('data-reduce-motion', 'true');
      } else {
        root.removeAttribute('data-reduce-motion');
      }

      if (this.isRegisteredUser()) {
        this.savePreferences(null, null, checked, null, null);
      }
    }

    onWaterTargetChange(event: Event): void {
      const raw = Number((event.target as HTMLInputElement).value);
      const safe = Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : 0;
      this.waterTargetMl.set(safe);

      const root = document.documentElement;
      root.setAttribute('data-water-target-ml', String(safe));

      this.emitPrefsChanged();

      if (this.isRegisteredUser()) {
        this.savePreferences(null, null, null, safe, null);
        this.scheduleProfilePatch({ waterDailyTargetMl: safe, updatedAt: new Date().toISOString() });
      }
    }

    onWaterGlassSizeChange(event: Event): void {
      const raw = Number((event.target as HTMLInputElement).value);
      const safe = Number.isFinite(raw) && raw >= 50 ? Math.round(raw) : 250;
      this.waterGlassSizeMl.set(safe);

      const root = document.documentElement;
      root.setAttribute('data-water-glass-ml', String(safe));

      this.emitPrefsChanged();

      if (this.isRegisteredUser()) {
        this.savePreferences(null, null, null, null, safe);
        this.scheduleProfilePatch({ waterGlassSizeMl: safe, updatedAt: new Date().toISOString() });
      }
    }

    private emitPrefsChanged(): void {
      window.dispatchEvent(new CustomEvent('macroTrackerPrefsChanged', {
        detail: {
          waterTargetMl: this.waterTargetMl(),
          waterGlassSizeMl: this.waterGlassSizeMl(),
        },
      }));
    }

    onWeightChange(event: Event): void {
      const raw = Number((event.target as HTMLInputElement).value);
      const safe = Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : null;
      this.weightKg.set(safe);
      if (this.isRegisteredUser()) {
        this.scheduleProfilePatch({ weightKg: safe, updatedAt: new Date().toISOString() });
      }
    }

    onHeightChange(event: Event): void {
      const raw = Number((event.target as HTMLInputElement).value);
      const safe = Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : null;
      this.heightCm.set(safe);
      if (this.isRegisteredUser()) {
        this.scheduleProfilePatch({ heightCm: safe, updatedAt: new Date().toISOString() });
      }
    }

    onAgeChange(event: Event): void {
      const raw = Number((event.target as HTMLInputElement).value);
      const safe = Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : null;
      this.age.set(safe);
      if (this.isRegisteredUser()) {
        this.scheduleProfilePatch({ age: safe, updatedAt: new Date().toISOString() });
      }
    }

    onGoalChange(event: Event): void {
      const value = String((event.target as HTMLSelectElement).value) as GoalType;
      this.goalType.set(value);
      if (this.isRegisteredUser()) {
        this.scheduleProfilePatch({ goalType: value, updatedAt: new Date().toISOString() });
      }
    }

    private isRegisteredUser(): boolean {
      return this.auth.isAuthenticated();
    }

    private scheduleProfilePatch(patch: Partial<UserProfile>): void {
      if (!this.isRegisteredUser()) {
        return;
      }

      const userId = this.auth.userId();
      if (!userId) {
        return;
      }

      this.pendingProfilePatch = { ...this.pendingProfilePatch, ...patch };
      if (this.profilePatchTimeoutId !== null) {
        window.clearTimeout(this.profilePatchTimeoutId);
      }

      this.profilePatchTimeoutId = window.setTimeout(() => {
        const payload = this.pendingProfilePatch;
        this.pendingProfilePatch = {};
        this.profilePatchTimeoutId = null;

        this.userProfileService.updatePartial(userId, payload)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            error: () => {
              this.toast.show('Nem sikerült menteni a beállításokat.');
            },
          });
      }, 450);
    }

    private savePreferences(
      theme: 'light' | 'dark' | null,
      contrast: 'normal' | 'high' | null,
      reduceMotion: boolean | null,
      waterTargetMl: number | null,
      waterGlassSizeMl: number | null,
    ): void {
    try {
      const raw = localStorage.getItem('macroTrackerPrefs');
        let prefs: {
          theme?: 'light' | 'dark';
          contrast?: 'normal' | 'high';
          reduceMotion?: boolean;
          waterTargetMl?: number;
          waterGlassSizeMl?: number;
        } = {};
      if (raw) {
        const parsed = JSON.parse(raw) as typeof prefs | null;
        if (parsed) {
          prefs = parsed;
        }
      }
      if (theme) {
        prefs.theme = theme;
      }
      if (contrast) {
        prefs.contrast = contrast;
      }
      if (reduceMotion !== null) {
        prefs.reduceMotion = reduceMotion;
      }
      if (waterTargetMl !== null) {
        prefs.waterTargetMl = waterTargetMl;
      }
      if (waterGlassSizeMl !== null) {
        prefs.waterGlassSizeMl = waterGlassSizeMl;
      }
      localStorage.setItem('macroTrackerPrefs', JSON.stringify(prefs));
    } catch {
      // Ha a localStorage nem írható, akkor futás közben maradnak meg a beállítások.
    }
  }
}
