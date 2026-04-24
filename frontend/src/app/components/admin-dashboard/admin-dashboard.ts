import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../services/contract';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  dashboard: any = null;
  loading = true;
  error = '';

  confidenceThreshold = 0.6;
  rateLimit = 100;
  savingSettings = false;
  settingsMessage = '';

  exportFrom = '';
  exportTo = '';
  exporting = false;

  private refreshTimer: any = null;
  lastUpdated: Date | null = null;

  userRole = '';

  constructor(
    private contractService: ContractService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.userRole = user?.role || '';
    }
  }

  ngOnInit() {
    this.loadDashboard();
    this.refreshTimer = setInterval(() => this.loadDashboard(true), 10000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadDashboard(silent = false) {
    if (!silent) this.loading = true;

    this.contractService.getDashboard().subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          this.dashboard = res;
          this.confidenceThreshold = res.settings?.confidenceThreshold || 0.6;
          this.rateLimit = res.settings?.rateLimit || 100;
          this.lastUpdated = new Date();
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.error = err?.error?.error || 'Failed to load dashboard';
          this.loading = false;
          if (!silent) {
            this.toast.fromHttpError(err, 'Dashboard load failed');
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

  get isAdmin(): boolean {
    return this.userRole === 'SYSTEM_ADMIN';
  }

  saveSettings() {
    if (!this.isAdmin) {
      this.toast.error('Access denied', 'Only System Administrators can change settings.');
      return;
    }

    // Client-side validation
    if (this.confidenceThreshold < 0 || this.confidenceThreshold > 1) {
      this.toast.warning('Invalid threshold', 'Confidence threshold must be between 0 and 1.');
      return;
    }
    if (this.rateLimit < 1 || this.rateLimit > 1000) {
      this.toast.warning('Invalid rate limit', 'Rate limit must be between 1 and 1000.');
      return;
    }

    this.savingSettings = true;
    this.settingsMessage = '';

    this.contractService.updateSettings({
      confidenceThreshold: this.confidenceThreshold,
      rateLimit: this.rateLimit
    }).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.savingSettings = false;
          this.toast.success(
            'Settings saved',
            `Confidence threshold: ${this.confidenceThreshold}, Rate limit: ${this.rateLimit}/10min`
          );
          this.loadDashboard(true);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.savingSettings = false;
          this.toast.fromHttpError(err, 'Could not save settings');
          this.cdr.detectChanges();
        });
      }
    });
  }

  exportAuditCsv() {
    if (!this.isAdmin) {
      this.toast.error('Access denied', 'Only System Administrators can export audit logs.');
      return;
    }

    // Validate date range if provided
    if (this.exportFrom && this.exportTo && new Date(this.exportFrom) > new Date(this.exportTo)) {
      this.toast.warning('Invalid date range', '"From" date must be before "To" date.');
      return;
    }

    this.exporting = true;
    this.contractService.exportAuditLogs(this.exportFrom, this.exportTo).subscribe({
      next: (blob: Blob) => {
        try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const timestamp = new Date().toISOString().split('T')[0];
          a.download = `audit_logs_${timestamp}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.exporting = false;
          this.toast.success(
            'Audit logs exported',
            `File downloaded as audit_logs_${timestamp}.csv`
          );
          this.cdr.detectChanges();
        } catch {
          this.exporting = false;
          this.toast.error('Download failed', 'Could not save the CSV file.');
        }
      },
      error: (err) => {
        this.exporting = false;
        this.toast.fromHttpError(err, 'Export failed');
        this.cdr.detectChanges();
      }
    });
  }

  confidencePct(count: number): number {
    const total = this.dashboard?.totalRequests || 1;
    return Math.round((count / total) * 100);
  }
}