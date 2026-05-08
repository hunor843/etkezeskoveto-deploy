import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);

  private hideTimeoutId: number | null = null;

  show(message: string, durationMs = 2500): void {
    this.message.set(message);

    if (this.hideTimeoutId !== null) {
      window.clearTimeout(this.hideTimeoutId);
    }

    this.hideTimeoutId = window.setTimeout(() => {
      this.message.set(null);
      this.hideTimeoutId = null;
    }, durationMs);
  }
}
