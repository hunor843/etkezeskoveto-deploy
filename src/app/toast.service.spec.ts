import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('should set message and clear after duration', () => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [ToastService],
    });

    const service = TestBed.inject(ToastService);
    service.show('Hello', 1000);

    expect(service.message()).toBe('Hello');

    vi.advanceTimersByTime(999);
    expect(service.message()).toBe('Hello');

    vi.advanceTimersByTime(1);
    expect(service.message()).toBeNull();

    vi.useRealTimers();
  });
});
