import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserProfile,
} from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'crm_access_token';
const REFRESH_TOKEN_KEY = 'crm_refresh_token';
const USER_KEY = 'crm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.loadUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {
    // Apply branding on init if user is logged in
    const user = this.loadUser();
    if (user) {
      this.applyBranding(user);
    }
  }

  get currentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  get accessToken(): string | null {
    return this.getAccessToken();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, credentials).pipe(
      tap((res) => this.storeSession(res)),
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/register`, data).pipe(
      tap((res) => this.storeSession(res)),
    );
  }

  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    return this.http
      .post<{ accessToken: string; refreshToken: string }>(`${this.api}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((res) => {
          localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
        }),
      );
  }

  logout(): void {
    this.http.post(`${this.api}/auth/logout`, {}).subscribe({ error: () => null });
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  loadProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.api}/auth/me`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.applyBranding(user);
      }),
    );
  }

  private applyBranding(user: UserProfile): void {
    const branding = (user.tenant?.settings as any)?.branding;
    if (!branding) return;

    // Apply primary color if exists
    if (branding.primaryColor) {
      document.documentElement.style.setProperty('--tenant-primary', branding.primaryColor);
      // Update Tailwind CSS variables
      document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
    }

    // Apply secondary color if exists
    if (branding.secondaryColor) {
      document.documentElement.style.setProperty('--tenant-secondary', branding.secondaryColor);
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
    this.applyBranding(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
  }

  private loadUser(): UserProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  }
}
