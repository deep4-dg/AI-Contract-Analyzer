import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../services/contract';

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

  // Settings form
  confidenceThreshold = 0.6;
  rateLimit = 100;
  savingSettings = false;
  settingsMessage = '';

  // Audit export
  exportFrom = '';
  exportTo = '';
  exporting = false;

  // Auto-refresh
  private refreshTimer: any = null;
  lastUpdated: Date | null = null;

  // User role check
  userRole = '';

  constructor(
    private contractService: ContractService,
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
    // Auto-refresh every 10 seconds (SRS §3.5 — real-time summary)
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
          this.cdr.detectChanges();
        });
      }
    });
  }

  get isAdmin(): boolean {
    return this.userRole === 'SYSTEM_ADMIN';
  }

  saveSettings() {
    if (!this.isAdmin) return;

    this.savingSettings = true;
    this.settingsMessage = '';

    this.contractService.updateSettings({
      confidenceThreshold: this.confidenceThreshold,
      rateLimit: this.rateLimit
    }).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.savingSettings = false;
          this.settingsMessage = '✓ Settings saved successfully';
          setTimeout(() => { this.settingsMessage = ''; this.cdr.detectChanges(); }, 3000);
          this.loadDashboard(true);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.savingSettings = false;
          this.settingsMessage = '✗ ' + (err?.error?.error || 'Failed to save');
          this.cdr.detectChanges();
        });
      }
    });
  }

  exportAuditCsv() {
    if (!this.isAdmin) return;

    this.exporting = true;
    this.contractService.exportAuditLogs(this.exportFrom, this.exportTo).subscribe({
      next: (blob: Blob) => {
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.exporting = false;
        alert('Export failed: ' + (err?.error?.error || 'Unknown error'));
      }
    });
  }

  /** Calculate confidence distribution percentage for the bar */
  confidencePct(count: number): number {
    const total = this.dashboard?.totalRequests || 1;
    return Math.round((count / total) * 100);
  }
}