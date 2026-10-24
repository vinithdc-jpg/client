import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { RegisterComponent } from './register';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let registerRequest: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    registerRequest = vi.fn();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { register: registerRequest },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not submit incomplete registration details', () => {
    component.onSubmit();

    expect(registerRequest).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe(
      'Please complete all required fields.',
    );
  });

  it('trims the name and email without changing email casing', () => {
    registerRequest.mockReturnValue(
      of({ message: 'Registration successful.', user: {} }),
    );
    component.name = '  DevCollab User  ';
    component.email = ' USER@example.com ';
    component.password = 'valid-password';
    component.role = 'client';

    component.onSubmit();
    fixture.detectChanges();

    expect(registerRequest).toHaveBeenCalledWith({
      name: 'DevCollab User',
      email: 'USER@example.com',
      password: 'valid-password',
      role: 'client',
    });
    expect(component.successMessage).toBe('Registration successful.');
    expect(component.password).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('displays registration errors from the API', () => {
    registerRequest.mockReturnValue(
      throwError(() => ({
        error: { message: 'An account with this email already exists.' },
      })),
    );
    component.name = 'DevCollab User';
    component.email = 'user@example.com';
    component.password = 'valid-password';

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe(
      'An account with this email already exists.',
    );
    expect(component.isLoading).toBe(false);
  });
});
