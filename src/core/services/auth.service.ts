import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole = 'client' | 'freelancer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active?: boolean;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly currentUserState = signal<AuthUser | null>(
    this.readStoredUser(),
  );
  readonly currentUser = this.currentUserState.asReadonly();

  register(data: RegisterRequest): Observable<{
    message: string;
    user: AuthUser;
  }> {
    return this.http.post<{
      message: string;
      user: AuthUser;
    }>(`${this.apiUrl}/register`, data);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data);
  }

  saveSession(response: AuthResponse): void {
    sessionStorage.setItem('auth_token', response.token);
    sessionStorage.setItem('auth_user', JSON.stringify(response.user));
    this.currentUserState.set(response.user);
  }

  logout(): void {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    this.currentUserState.set(null);
  }

  private readStoredUser(): AuthUser | null {
    const storedUser = sessionStorage.getItem('auth_user');
    if (!storedUser) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(storedUser);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'id' in parsed &&
        typeof parsed.id === 'string' &&
        'name' in parsed &&
        typeof parsed.name === 'string' &&
        'email' in parsed &&
        typeof parsed.email === 'string' &&
        'role' in parsed &&
        (parsed.role === 'client' || parsed.role === 'freelancer')
      ) {
        return {
          id: parsed.id,
          name: parsed.name,
          email: parsed.email,
          role: parsed.role,
        };
      }
    } catch {
      sessionStorage.removeItem('auth_user');
    }

    return null;
  }
}
