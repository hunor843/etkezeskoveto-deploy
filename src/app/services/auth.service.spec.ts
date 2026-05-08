import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthError, AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login should normalize email and call /auth/login', async () => {
    const promise = firstValueFrom(
      service.login({ email: '  HUNOR@EXAMPLE.COM  ', password: 'Hunor1234' }),
    );

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'hunor@example.com',
      password: 'Hunor1234',
    });

    req.flush({
      id: '1',
      displayName: 'Hunor',
      email: 'hunor@example.com',
      role: 'user',
      dailyCalorieTarget: 2200,
      waterDailyTargetMl: 2400,
      waterGlassSizeMl: 300,
    });

    const user = await promise;
    expect(user.email).toBe('hunor@example.com');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('login should map 401 to INVALID_CREDENTIALS AuthError', async () => {
    const promise = firstValueFrom(
      service.login({ email: 'hunor@example.com', password: 'bad' }),
    );

    const req = httpMock.expectOne('/api/auth/login');
    req.flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(promise).rejects.toBeInstanceOf(AuthError);
    await expect(promise).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('register should fail with EMAIL_TAKEN when user exists', async () => {
    const promise = firstValueFrom(
      service.register({
        displayName: 'Hunor',
        email: 'hunor@example.com',
        password: 'Hunor1234',
      }),
    );

    const findReq = httpMock.expectOne((r) =>
      r.method === 'GET' && r.url === '/api/users' && r.params.get('email') === 'hunor@example.com',
    );
    findReq.flush([
      {
        id: '1',
        displayName: 'Hunor',
        email: 'hunor@example.com',
        role: 'user',
        dailyCalorieTarget: 2200,
        waterDailyTargetMl: 2400,
        waterGlassSizeMl: 300,
      },
    ]);

    await expect(promise).rejects.toBeInstanceOf(AuthError);
    await expect(promise).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
  });

  it('register should POST plain password and normalize email', async () => {
    const promise = firstValueFrom(
      service.register({
        displayName: '  Hunor  ',
        email: '  HUNOR@EXAMPLE.COM ',
        password: 'Hunor1234',
      }),
    );

    const findReq = httpMock.expectOne((r) =>
      r.method === 'GET' && r.url === '/api/users' && r.params.get('email') === 'hunor@example.com',
    );
    findReq.flush([]);

    const createReq = httpMock.expectOne('/api/users');
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body.email).toBe('hunor@example.com');
    expect(createReq.request.body.displayName).toBe('Hunor');
    expect(createReq.request.body.password).toBe('Hunor1234');
    expect(createReq.request.body.role).toBe('user');
    expect(createReq.request.body.createdAt).toBeTruthy();
    expect(createReq.request.body.updatedAt).toBeTruthy();

    createReq.flush({
      id: '1',
      ...createReq.request.body,
    });

    const created = await promise;
    expect(created.email).toBe('hunor@example.com');
    expect(service.userId()).toBe('1');
  });

  it('logout should clear session and localStorage keys', () => {
    // Arrange an authenticated state via successful login
    service.login({ email: 'hunor@example.com', password: 'Hunor1234' }).subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({
      id: '1',
      displayName: 'Hunor',
      email: 'hunor@example.com',
      role: 'user',
      dailyCalorieTarget: 2200,
      waterDailyTargetMl: 2400,
      waterGlassSizeMl: 300,
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('macroTrackerAuth')).toBeTruthy();
    expect(localStorage.getItem('macroTrackerUserType')).toBe('registered');

    // Act
    service.logout();

    // Assert
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('macroTrackerAuth')).toBeNull();
    expect(localStorage.getItem('macroTrackerUserType')).toBeNull();
  });
});
