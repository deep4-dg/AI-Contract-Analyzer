import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../services/contract';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  name = '';
  email = '';
  password = '';
  role = 'LEGAL_PROFESSIONAL';

  isSignup = false;
  showPassword = false;
  loading = false;
  error = '';

  constructor(
    private service: ContractService,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    console.log('[LoginComponent] constructor — toast service:', !!this.toast);
  }

  submit() {
    console.log('[LoginComponent] submit() called');
    this.error = '';

    // ── Client-side validation ─────────────────────────────────────────────
    if (!this.email.trim()) {
      this.toast.warning('Email required', 'Please enter your email address.');
      return;
    }
    if (!this.password.trim()) {
      this.toast.warning('Password required', 'Please enter your password.');
      return;
    }
    if (this.isSignup && !this.name.trim()) {
      this.toast.warning('Name required', 'Please enter your full name.');
      return;
    }
    if (this.isSignup && this.password.length < 6) {
      this.toast.warning('Weak password', 'Password must be at least 6 characters long.');
      return;
    }

    this.loading = true;

    // ── Signup flow ────────────────────────────────────────────────────────
    if (this.isSignup) {
      this.service.signup({
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.role
      }).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.loading = false;
            this.toast.success(
              'Account created!',
              'You can now sign in with your new credentials.'
            );
            this.isSignup = false;
            this.name = '';
            this.password = '';
            this.cdr.detectChanges();
          });
        },
        error: (err: any) => {
          this.ngZone.run(() => {
            this.loading = false;
            console.error('[Signup error]', err);
            this.toast.fromHttpError(err, 'Signup failed');
            this.cdr.detectChanges();
          });
        }
      });
      return;
    }

    // ── Login flow ─────────────────────────────────────────────────────────
    this.service.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        console.log('[Login success]', res);
        this.ngZone.run(() => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            this.toast.success(
              `Welcome back, ${res.user?.name || 'User'}!`,
              `Logged in as ${(res.user?.role || '').replace('_', ' ')}`
            );
            // Small delay so user sees the success toast before redirect
            setTimeout(() => {
              this.router.navigate(['/home']).then(() => {
                window.location.reload();
              });
            }, 800);
          }
        });
      },
      error: (err: any) => {
        console.error('[Login error]', err);
        this.ngZone.run(() => {
          this.loading = false;
          this.toast.fromHttpError(err, 'Login failed');
          this.cdr.detectChanges();
        });
      }
    });
  }

  toggleMode(event: Event) {
    event.preventDefault();
    this.error = '';
    this.isSignup = !this.isSignup;
  }

  fillCreds(email: string, password: string) {
    this.email = email;
    this.password = password;
    this.error = '';
    this.toast.info('Credentials filled', 'Click Sign In to continue.');
  }
}