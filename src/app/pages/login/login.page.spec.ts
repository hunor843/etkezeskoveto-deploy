import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../toast.service';
import { LoginPageComponent } from './login.page';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;

  it('should detect password mismatch on register form', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: AuthService, useValue: { login: () => of(null), register: () => of(null) } },
        { provide: ToastService, useValue: { show: vi.fn() } },
        { provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;

    component.showRegisterForm();
    (component as any).registerForm.patchValue({
      displayName: 'Hunor',
      email: 'hunor@example.com',
      password: 'Hunor1234',
      passwordConfirm: 'Other1234',
    });
    fixture.detectChanges();

    expect((component as any).passwordMismatch()).toBe(true);
  });

  it('onLoginSubmit should not call auth.login when form invalid', async () => {
    const loginSpy = vi.fn(() => of(null));

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: AuthService, useValue: { login: loginSpy, register: () => of(null) } },
        { provide: ToastService, useValue: { show: vi.fn() } },
        { provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;

    // invalid: empty fields
    component.onLoginSubmit(new Event('submit'));

    expect(loginSpy).not.toHaveBeenCalled();
    expect((component as any).loginForm.touched).toBe(true);
  });

  it('onLoginSubmit should sanitize unsafe returnUrl and navigate to /', async () => {
    const loginSpy = vi.fn(() =>
      of({
        id: '1',
        displayName: 'Hunor',
        email: 'hunor@example.com',
        role: 'user',
        dailyCalorieTarget: 2200,
        waterDailyTargetMl: 2400,
        waterGlassSizeMl: 300,
      }),
    );

    const navigateByUrl = vi.fn(() => Promise.resolve(true));
    const toastShow = vi.fn();

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: AuthService, useValue: { login: loginSpy, register: () => of(null) } },
        { provide: ToastService, useValue: { show: toastShow } },
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => '//evil.com' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;

    (component as any).loginForm.setValue({
      email: 'hunor@example.com',
      password: 'Hunor1234',
    });

    component.onLoginSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(loginSpy).toHaveBeenCalled();
    expect(toastShow).toHaveBeenCalledWith('Sikeres bejelentkezés.');
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });
});
