import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  /** Reactive stream of visible toasts */
  private _toasts$ = new BehaviorSubject<Toast[]>([]);
  toasts$ = this._toasts$.asObservable();

  private counter = 0;

  /** Show a success toast (green) */
  success(title: string, message?: string, duration = 4000) {
    this.show('success', title, message, duration);
  }

  /** Show an error toast (red) */
  error(title: string, message?: string, duration = 6000) {
    this.show('error', title, message, duration);
  }

  /** Show a warning toast (amber) */
  warning(title: string, message?: string, duration = 5000) {
    this.show('warning', title, message, duration);
  }

  /** Show an info toast (blue) */
  info(title: string, message?: string, duration = 4000) {
    this.show('info', title, message, duration);
  }

  /** Parse an HTTP error and show the correct toast automatically */
  fromHttpError(err: any, fallbackTitle = 'Something went wrong') {
    console.log('[Toast.fromHttpError]', err); // Helps debug if toast not showing

    let title = fallbackTitle;
    let message = '';

    if (!err) {
      title = 'Network error';
      message = 'Could not reach the server. Please check your connection.';
    } else if (err.status === 0) {
      title = 'Connection failed';
      message = 'The server is not responding. Is the backend running on port 5000?';
    } else if (err.status === 400) {
      title = 'Invalid request';
      message = err?.error?.error || 'Please check your input and try again.';
    } else if (err.status === 401) {
      title = 'Invalid credentials';
      message = err?.error?.error || 'Email or password is incorrect.';
    } else if (err.status === 403) {
      title = 'Access denied';
      message = err?.error?.error || 'You do not have permission to perform this action.';
    } else if (err.status === 404) {
      title = 'Not found';
      message = err?.error?.error || 'The requested resource was not found.';
    } else if (err.status === 429) {
      title = 'Too many requests';
      message = err?.error?.error || 'Please wait a moment before trying again.';
    } else if (err.status >= 500) {
      title = 'Server error';
      message = err?.error?.error || 'Something went wrong on our end. Please try again.';
    } else if (err?.error?.error) {
      message = err.error.error;
    } else if (err?.message) {
      message = err.message;
    }

    this.error(title, message);
  }

  private show(type: ToastType, title: string, message?: string, duration = 4000) {
    const id = ++this.counter;
    const toast: Toast = { id, type, title, message, duration };

    const current = this._toasts$.value;
    this._toasts$.next([...current, toast]);

    console.log('[Toast]', type.toUpperCase(), '-', title, message || ''); // Debug

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  dismiss(id: number) {
    const filtered = this._toasts$.value.filter(t => t.id !== id);
    this._toasts$.next(filtered);
  }

  clear() {
    this._toasts$.next([]);
  }
}