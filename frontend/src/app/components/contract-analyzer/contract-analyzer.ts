import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../services/contract';

@Component({
  selector: 'app-contract-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-analyzer.html',
  styleUrls: ['./contract-analyzer.css']
})
export class ContractAnalyzerComponent {

  // ── Form state ────────────────────────────────────────────────────────────
  contractText = '';
  language = 'English';
  inputMode: 'text' | 'pdf' = 'text';
  selectedFile: File | null = null;

  // ── UI state ──────────────────────────────────────────────────────────────
  loading = false;
  error = '';
  result: any = null;
  fileMeta: any = null; // holds info about the uploaded PDF (pages, chars, etc.)

  constructor(
    private contractService: ContractService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.error = 'Only PDF files are supported. Please select a .pdf file.';
        this.selectedFile = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'File is too large. Maximum size is 5 MB.';
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
      this.error = '';
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      this.error = 'Only PDF files are supported.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'File is too large. Maximum size is 5 MB.';
      return;
    }
    this.selectedFile = file;
    this.error = '';
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
  }

  setMode(mode: 'text' | 'pdf'): void {
    this.inputMode = mode;
    this.result = null;
    this.fileMeta = null;
    this.error = '';
    if (mode === 'text') this.selectedFile = null;
    if (mode === 'pdf') this.contractText = '';
  }

  get canSubmit(): boolean {
    if (this.loading) return false;
    if (this.inputMode === 'text') return this.contractText.trim().length >= 20;
    if (this.inputMode === 'pdf') return this.selectedFile !== null;
    return false;
  }

  /** Risk class helper for template (handles "Critical" → red, "Low" → green, etc.) */
  riskClass(level: string): string {
    if (!level) return '';
    return 'risk-' + level.toLowerCase();
  }

  analyzeContract(): void {
    this.loading = true;
    this.error = '';
    this.result = null;
    this.fileMeta = null;

    const finish = (res: any, isFile: boolean) => {
      // Run inside Angular zone so the UI updates immediately
      this.ngZone.run(() => {
        this.result = res.result;
        if (isFile) {
          this.fileMeta = {
            filename: res.filename,
            totalPages: res.totalPages,
            extractedChars: res.extractedChars
          };
        }
        this.loading = false;
        this.cdr.detectChanges(); // force re-render
        // Scroll to result after render
        setTimeout(() => {
          document.querySelector('.result-card')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    };

    const fail = (err: any) => {
      this.ngZone.run(() => {
        this.error = err?.error?.error || 'Failed to analyze contract. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      });
    };

    if (this.inputMode === 'pdf' && this.selectedFile) {
      this.contractService
        .analyzeContractFile(this.selectedFile, this.language)
        .subscribe({
          next: (res: any) => finish(res, true),
          error: fail
        });
    } else {
      this.contractService
        .analyzeContract(this.contractText, this.language)
        .subscribe({
          next: (res: any) => finish(res, false),
          error: fail
        });
    }
  }

  /** Download result as JSON file */
  downloadResult(): void {
    if (!this.result) return;
    const blob = new Blob([JSON.stringify(this.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Reset form for a new analysis */
  newAnalysis(): void {
    this.result = null;
    this.fileMeta = null;
    this.error = '';
    this.contractText = '';
    this.selectedFile = null;
  }
}