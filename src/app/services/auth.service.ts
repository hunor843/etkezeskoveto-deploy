import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { EntityId, UserProfile } from '../models/entities';

export type AuthErrorCode =
  | 'EMAIL_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
  }
}

type PersistedAuthSession = {
  userId: EntityId;
  email: string;
  createdAtIso: string;
};

const AUTH_STORAGE_KEY = 'macroTrackerAuth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly currentUser = signal<UserProfile | null>(null);

  readonly user = computed(() => this.currentUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userId = computed<EntityId | null>(() => this.currentUser()?.id ?? null);

  constructor() {
    this.restoreSessionFromStorage();
  }

  register(payload: { displayName: string; email: string; password: string }) {
    const email = this.normalizeEmail(payload.email);
    const displayName = payload.displayName.trim() || 'Felhasználó';

    return this.findUserByEmail(email).pipe(
      switchMap((existing) => {
        if (existing) {
          return throwError(() => new AuthError('EMAIL_TAKEN', 'Ezzel az email címmel már létezik fiók.'));
        }

        const nowIso = new Date().toISOString();
        const createBody: Omit<UserProfile, 'id'> & { password: string } = {
          displayName,
          email,
          // send plain password to server; server will hash
          password: payload.password,
          role: 'user',
          dailyCalorieTarget: 2200,
          waterDailyTargetMl: 2400,
          waterGlassSizeMl: 300,
          weightKg: null,
          heightCm: null,
          age: null,
          goalType: 'maintain',
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        return this.http.post<UserProfile>(`${environment.apiBaseUrl}/users`, createBody);
      }),
      map((createdUser) => {
        this.setSession(createdUser);
        return createdUser;
      }),
      catchError((err: unknown) => {
        if (err instanceof AuthError) {
          return throwError(() => err);
        }
        return throwError(() => this.mapUnknownError(err));
      }),
    );
  }

  login(payload: { email: string; password: string }) {
    const email = this.normalizeEmail(payload.email);

    // Delegate login to server-side auth endpoint
    return this.http.post<UserProfile>(`${environment.apiBaseUrl}/auth/login`, { email, password: payload.password }).pipe(
      map((user) => {
        this.setSession(user);
        return user;
      }),
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          return throwError(() => new AuthError('INVALID_CREDENTIALS', 'Hibás email vagy jelszó.'));
        }
        if (err instanceof AuthError) {
          return throwError(() => err);
        }
        return throwError(() => this.mapUnknownError(err));
      }),
    );
  }

  logout(): void {
    this.currentUser.set(null);

    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('macroTrackerUserType');
    } catch {
      // ignore
    }
  }

  private restoreSessionFromStorage(): void {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as PersistedAuthSession | null;
      if (!parsed?.userId || !parsed.email) {
        return;
      }

      // Restore a minimal auth UI state synchronously, then refresh user details from backend.
      const placeholder: UserProfile = {
        id: parsed.userId,
        displayName: parsed.email,
        email: parsed.email,
        role: 'user',
        dailyCalorieTarget: 2200,
        waterDailyTargetMl: 2400,
        waterGlassSizeMl: 300,
      };
      this.currentUser.set(placeholder);

      // Ensure other parts of the app still treat the user as registered.
      try {
        localStorage.setItem('macroTrackerUserType', 'registered');
      } catch {
        // ignore
      }

      this.http.get<UserProfile>(`${environment.apiBaseUrl}/users/${parsed.userId}`)
        .pipe(
          catchError((err: unknown) => {
            if (err instanceof HttpErrorResponse && err.status === 404) {
              return of(null);
            }
            // Keep the placeholder user if backend is temporarily unavailable.
            return of(placeholder);
          }),
        )
        .subscribe((user) => {
          if (!user) {
            this.logout();
            return;
          }

          this.currentUser.set(user);
        });
    } catch {
      // Bad JSON or storage blocked
      this.logout();
    }
  }

  private setSession(user: UserProfile): void {
    this.currentUser.set(user);

    const session: PersistedAuthSession = {
      userId: user.id,
      email: user.email,
      createdAtIso: new Date().toISOString(),
    };

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem('macroTrackerUserType', 'registered');
    } catch {
      // If storage is not writable, we still keep session in memory.
    }
  }

  private findUserByEmail(email: string) {
    const params = new HttpParams().set('email', email);
    return this.http.get<UserProfile[]>(`${environment.apiBaseUrl}/users`, { params }).pipe(
      map((users) => users?.[0] ?? null),
    );
  }

  private normalizeEmail(value: string): string {
    return value.trim().toLocaleLowerCase('en-US');
  }

  private hashPassword(password: string) {
    return of(password).pipe(
      switchMap(async (raw) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(raw);
        const digest = await crypto.subtle.digest('SHA-256', data);
        const bytes = new Uint8Array(digest);
        return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      }),
      catchError(() => throwError(() => new AuthError('UNKNOWN_ERROR', 'Nem sikerült feldolgozni a jelszót.'))),
    );
  }

  private mapUnknownError(err: unknown): AuthError {
    // HttpClient network errors are often HttpErrorResponse; keep mapping simple and user-friendly.
    if (typeof err === 'object' && err && 'status' in err) {
      return new AuthError('NETWORK_ERROR', 'A művelet nem sikerült. Ellenőrizd a kapcsolatot és próbáld újra.');
    }
    return new AuthError('UNKNOWN_ERROR', 'A művelet nem sikerült. Próbáld meg később.');
  }
}
