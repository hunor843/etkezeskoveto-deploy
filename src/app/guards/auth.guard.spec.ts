import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('should allow navigation when authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => true },
        },
        {
          provide: Router,
          useValue: { createUrlTree: () => new UrlTree() },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/settings' } as any),
    );

    expect(result).toBe(true);
  });

  it('should redirect to /login with returnUrl when not authenticated', () => {
    const createUrlTree = vi.fn(() => new UrlTree());

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => false },
        },
        {
          provide: Router,
          useValue: { createUrlTree },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/settings?x=1' } as any),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/settings?x=1' },
    });
  });
});
