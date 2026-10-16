import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginComponent } from './login';
import { throwError } from 'rxjs';
import { vi } from 'vitest';

describe('LoginComponent', () => {
  let login: LoginComponent;
  let loginRequest: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    loginRequest = vi.fn();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: AuthService,
          useValue: { login: loginRequest },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    login = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(login).toBeTruthy();
  });

  it('shows the server login error in the page', () => {
    loginRequest.mockReturnValue(
      throwError(() => ({
        error: { message: 'Invalid email or password.' },
      })),
    );
    login.email = 'user@example.com';
    login.password = 'wrong-password';

    login.onSubmit();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[role="alert"]')?.textContent,
    ).toContain('Invalid email or password.');
    expect(login.isLoading).toBe(false);
  });

  it('shows a fallback if the server error message is empty', () => {
    loginRequest.mockReturnValue(throwError(() => ({ error: { message: '' } })));
    login.email = 'user@example.com';
    login.password = 'wrong-password';

    login.onSubmit();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[role="alert"]')?.textContent,
    ).toContain('Unable to sign in. Please try again.');
  });
});
