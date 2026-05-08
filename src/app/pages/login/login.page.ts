import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, ReactiveFormsModule, ValidationErrors, Validators, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../toast.service';
import { AuthError, AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class LoginPageComponent {
  protected readonly showRegister = signal(false);
  protected readonly lastActionMessage = signal('');

	protected readonly submitting = signal(false);
	protected readonly formError = signal<string | null>(null);

	private readonly auth = inject(AuthService);
	private readonly fb = inject(FormBuilder);
	private readonly destroyRef = inject(DestroyRef);

	private readonly toast = inject(ToastService);
	private readonly router = inject(Router);
	private readonly route = inject(ActivatedRoute);

	protected readonly passwordHint = 'Minimum 8 karakter, legalább 1 betű és 1 szám.';

	protected readonly loginForm = this.fb.nonNullable.group({
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required, Validators.minLength(8)]],
	});

	protected readonly registerForm = this.fb.nonNullable.group({
		displayName: ['', [Validators.required, Validators.minLength(2)]],
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]],
		passwordConfirm: ['', [Validators.required]],
	}, {
		validators: [this.passwordsMatchValidator],
	});

	protected readonly passwordMismatch = computed(() => {
		const groupErrors = this.registerForm.errors;
		return Boolean(groupErrors?.['passwordMismatch']);
	});

  showRegisterForm(): void {
    this.showRegister.set(true);
		this.formError.set(null);
  }

  showLoginForm(): void {
    this.showRegister.set(false);
		this.formError.set(null);
  }

  onLoginSubmit(event: Event): void {
    event.preventDefault();

		this.formError.set(null);
		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}

		const value = this.loginForm.getRawValue();
		this.submitting.set(true);
		this.auth.login({ email: value.email, password: value.password })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.submitting.set(false);
					this.persistCurrentUiPrefs();
					const message = 'Sikeres bejelentkezés.';
					this.lastActionMessage.set(message);
					this.toast.show(message);
					void this.router.navigateByUrl(this.getPostAuthRedirectUrl());
				},
				error: (err: unknown) => {
					this.submitting.set(false);
					const message = err instanceof AuthError ? err.message : 'Nem sikerült bejelentkezni.';
					this.formError.set(message);
					this.toast.show(message);
				},
			});
  }

  onRegisterSubmit(event: Event): void {
    event.preventDefault();

		this.formError.set(null);
		if (this.registerForm.invalid) {
			this.registerForm.markAllAsTouched();
			return;
		}

		const value = this.registerForm.getRawValue();
		this.submitting.set(true);
		this.auth.register({
			displayName: value.displayName,
			email: value.email,
			password: value.password,
		})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.submitting.set(false);
					this.persistCurrentUiPrefs();
					const message = 'Sikeres regisztráció.';
					this.lastActionMessage.set(message);
					this.toast.show(message);
					void this.router.navigateByUrl(this.getPostAuthRedirectUrl());
				},
				error: (err: unknown) => {
					this.submitting.set(false);
					const message = err instanceof AuthError ? err.message : 'Nem sikerült regisztrálni.';
					this.formError.set(message);
					this.toast.show(message);
				},
			});
  }

	private getPostAuthRedirectUrl(): string {
		const raw = this.route.snapshot.queryParamMap.get('returnUrl');
		if (!raw) {
			return '/';
		}

		const trimmed = raw.trim();
		if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
			return '/';
		}

		if (trimmed === '/login' || trimmed.startsWith('/login?')) {
			return '/';
		}

		return trimmed;
	}

	private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
		const group = control as { get: (name: string) => AbstractControl | null };
		const password = group.get('password')?.value;
		const passwordConfirm = group.get('passwordConfirm')?.value;
		if (!password || !passwordConfirm) {
			return null;
		}
		return password === passwordConfirm ? null : { passwordMismatch: true };
	}

	private persistCurrentUiPrefs(): void {
		try {
			const root = document.documentElement;
			const theme = (root.getAttribute('data-theme') as 'light' | 'dark' | null) ?? 'light';
			const contrast = (root.getAttribute('data-contrast') as 'normal' | 'high' | null) ?? 'normal';
			const reduceMotion = root.getAttribute('data-reduce-motion') === 'true';

			const raw = localStorage.getItem('macroTrackerPrefs');
			const existing = raw ? (JSON.parse(raw) as Record<string, unknown> | null) : null;

			const prefs = {
				...(existing ?? {}),
				theme,
				contrast,
				reduceMotion,
			};
			localStorage.setItem('macroTrackerPrefs', JSON.stringify(prefs));
		} catch {
			// ignore
		}
	}
}
