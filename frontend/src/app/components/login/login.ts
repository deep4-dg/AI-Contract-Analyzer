import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../services/contract';
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
    private router: Router
  ) {}

  submit() {
    this.error = '';
    this.loading = true;

    if (this.isSignup) {
      if (!this.name.trim()) {
        this.error = 'Please enter your full name.';
        this.loading = false;
        return;
      }
      this.service.signup({
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.role
      }).subscribe({
        next: () => {
          this.loading = false;
          alert('Signup successful. Please login.');
          this.isSignup = false;
          this.name = '';
          this.password = '';
        },
        error: (err: any) => {
          this.loading = false;
          this.error = err?.error?.error || 'Signup failed. Email may already exist.';
        }
      });
    } else {
      this.service.login({
        email: this.email,
        password: this.password
      }).subscribe({
        next: (res: any) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            this.router.navigate(['/home']).then(() => {
              window.location.reload();
            });
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.error = err?.error?.error || 'Invalid email or password.';
        }
      });
    }
  }

  toggleMode(event: Event) {
    event.preventDefault();
    this.error = '';
    this.isSignup = !this.isSignup;
  }

  /** Quick-fill test credentials on click */
  fillCreds(email: string, password: string) {
    this.email = email;
    this.password = password;
    this.error = '';
  }
}