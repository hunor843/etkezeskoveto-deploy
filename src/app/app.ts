import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header.component';
import { FooterComponent } from './layout/footer.component';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = signal('Macro Tracker');

  protected readonly showBackToTop = signal(false);

	private readonly toast = inject(ToastService);
	protected readonly toastMessage = computed(() => this.toast.message());

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollY = window.scrollY || window.pageYOffset;
    const viewport = window.innerHeight;
    const full = document.documentElement.scrollHeight;
    const atBottom = scrollY + viewport >= full - 2;
    this.showBackToTop.set(atBottom);
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
