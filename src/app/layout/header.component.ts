import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastService } from '../toast.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  protected onLogout(): void {
    this.auth.logout();

    try {
      localStorage.removeItem('macroTrackerPrefs');
    } catch {
      // Ha a localStorage nem elérhető, akkor is visszaváltunk vendég módra vizuálisan.
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', 'light');
    root.setAttribute('data-contrast', 'normal');
    root.removeAttribute('data-reduce-motion');
    root.removeAttribute('data-water-target-ml');
    root.removeAttribute('data-water-glass-ml');

    window.dispatchEvent(new CustomEvent('macroTrackerPrefsChanged', {
      detail: {
        waterTargetMl: 2400,
        waterGlassSizeMl: 300,
      },
    }));

    this.toast.show('Sikeres kijelentkezés.');

    this.router.navigateByUrl('/');
  }
}
