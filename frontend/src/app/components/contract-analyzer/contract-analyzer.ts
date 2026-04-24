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

  contractText = '';
  language = 'English';
  inputMode: 'text' | 'pdf' = 'text';
  selectedFile: File | null = null;

  loading = false;
  loadingStep = 0;
  error = '';
  result: any = null;
  fileMeta: any = null;

  private loadingTimer: any = null;

  constructor(
    private contractService: ContractService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSet(input.files[0]);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.validateAndSet(file);
  }

  private validateAndSet(file: File) {
    if (file.type !== 'application/pdf') {
      this.error = 'Only PDF files are supported.';
      this.selectedFile = null;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'File exceeds 5 MB limit.';
      this.selectedFile = null;
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

  get charCount(): number { return this.contractText.length; }

  /** Risk class helper */
  riskClass(level: string): string {
    return level ? 'risk-' + level.toLowerCase() : 'risk-medium';
  }

  /** Count clauses by risk level */
  clauseCountByRisk(level: string): number {
    if (!this.result?.clauses) return 0;
    return this.result.clauses.filter(
      (c: any) => c.riskLevel?.toLowerCase() === level.toLowerCase()
    ).length;
  }

  /** Get confidence percentage as integer */
  confidencePct(score: number): number {
    return Math.round((score || 0) * 100);
  }

  /** Confidence color based on score */
  confidenceColor(score: number): string {
    if (score >= 0.8) return 'var(--risk-low)';
    if (score >= 0.6) return 'var(--risk-medium)';
    return 'var(--risk-critical)';
  }

  analyzeContract(): void {
    this.loading = true;
    this.error = '';
    this.result = null;
    this.fileMeta = null;
    this.loadingStep = 0;

    // Animated loading steps
    this.loadingTimer = setInterval(() => {
      this.ngZone.run(() => {
        this.loadingStep = (this.loadingStep + 1) % 4;
        this.cdr.detectChanges();
      });
    }, 2500);

    const finish = (res: any, isFile: boolean) => {
      this.ngZone.run(() => {
        clearInterval(this.loadingTimer);
        this.result = res.result;
        if (isFile) {
          this.fileMeta = {
            filename: res.filename,
            totalPages: res.totalPages,
            extractedChars: res.extractedChars
          };
        }
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          document.querySelector('.results-dashboard')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      });
    };

    const fail = (err: any) => {
      this.ngZone.run(() => {
        clearInterval(this.loadingTimer);
        this.error = err?.error?.error || 'Analysis failed. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      });
    };

    if (this.inputMode === 'pdf' && this.selectedFile) {
      this.contractService.analyzeContractFile(this.selectedFile, this.language)
        .subscribe({ next: (r: any) => finish(r, true), error: fail });
    } else {
      this.contractService.analyzeContract(this.contractText, this.language)
        .subscribe({ next: (r: any) => finish(r, false), error: fail });
    }
  }

  downloadResult(): void {
    if (!this.result) return;
    const blob = new Blob([JSON.stringify(this.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_analysis_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  newAnalysis(): void {
    this.result = null;
    this.fileMeta = null;
    this.error = '';
    this.contractText = '';
    this.selectedFile = null;
  }

  loadingMessages = [
    '📄 Reading contract text...',
    '🔍 Identifying legal clauses...',
    '⚖️  Analyzing risk for each clause...',
    '✨ Generating recommendations...'
  ];
}