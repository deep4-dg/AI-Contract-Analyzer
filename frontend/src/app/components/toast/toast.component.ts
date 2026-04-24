import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      <div
        *ngFor="let t of (toast.toasts$ | async)"
        class="toast"
        [ngClass]="'toast-' + t.type"
        (click)="toast.dismiss(t.id)">

        <!-- Icon -->
        <div class="toast-icon">
          <svg *ngIf="t.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <svg *ngIf="t.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <svg *ngIf="t.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <svg *ngIf="t.type === 'info'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>

        <!-- Content -->
        <div class="toast-body">
          <div class="toast-title">{{ t.title }}</div>
          <div class="toast-message" *ngIf="t.message">{{ t.message }}</div>
        </div>

        <!-- Close button -->
        <button class="toast-close" (click)="toast.dismiss(t.id); $event.stopPropagation()" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <!-- Progress bar -->
        <div class="toast-progress" [style.animation-duration.ms]="t.duration"></div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
      max-width: 420px;
      width: calc(100% - 40px);
    }

    .toast {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 44px 14px 16px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 32px rgba(10, 37, 64, 0.15), 0 2px 8px rgba(10, 37, 64, 0.06);
      pointer-events: auto;
      cursor: pointer;
      overflow: hidden;
      border: 1px solid #E2E5EC;
      animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 320px;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }

    .toast::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
    }

    .toast-success::before { background: #00A389; }
    .toast-error::before   { background: #DC2626; }
    .toast-warning::before { background: #E8B86D; }
    .toast-info::before    { background: #2563EB; }

    .toast-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast-icon svg {
      width: 18px;
      height: 18px;
    }

    .toast-success .toast-icon { background: #E8F9F4; color: #00A389; }
    .toast-error   .toast-icon { background: #FEE2E2; color: #DC2626; }
    .toast-warning .toast-icon { background: #FEF5E7; color: #B26A00; }
    .toast-info    .toast-icon { background: #DBEAFE; color: #2563EB; }

    .toast-body {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 600;
      color: #0A2540;
      font-size: 14px;
      margin-bottom: 2px;
      line-height: 1.3;
    }

    .toast-message {
      font-size: 13px;
      color: #4A5568;
      line-height: 1.5;
      word-break: break-word;
    }

    .toast-close {
      position: absolute !important;
      top: 10px !important;
      right: 10px !important;
      width: 24px !important;
      height: 24px !important;
      padding: 0 !important;
      background: transparent !important;
      color: #9BA3B3 !important;
      border: none !important;
      border-radius: 4px !important;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 !important;
      transition: all 0.15s;
    }

    .toast-close:hover {
      background: #F7F8FA !important;
      color: #2D3748 !important;
      transform: none !important;
      box-shadow: none !important;
    }

    .toast-close svg {
      width: 14px;
      height: 14px;
    }

    .toast-progress {
      position: absolute;
      left: 0;
      bottom: 0;
      height: 3px;
      width: 100%;
      opacity: 0.5;
      animation: shrink linear forwards;
      transform-origin: left;
    }

    .toast-success .toast-progress { background: #00A389; }
    .toast-error   .toast-progress { background: #DC2626; }
    .toast-warning .toast-progress { background: #E8B86D; }
    .toast-info    .toast-progress { background: #2563EB; }

    @keyframes shrink {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }

    @media (max-width: 500px) {
      .toast-container {
        top: 10px;
        right: 10px;
        left: 10px;
        width: auto;
      }
      .toast { min-width: 0; }
    }
  `]
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}