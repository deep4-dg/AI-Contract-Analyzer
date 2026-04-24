import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../services/contract';
import { ToastService } from '../../services/toast.service';

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

  loadingMessages = [
    '📄 Reading contract text...',
    '🔍 Identifying legal clauses...',
    '⚖️  Analyzing risk for each clause...',
    '✨ Generating recommendations...'
  ];

  constructor(
    private contractService: ContractService,
    private toast: ToastService,
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
      this.toast.error('Invalid file type', 'Only PDF files are supported. Please select a .pdf file.');
      this.selectedFile = null;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('File too large', `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum size is 5 MB.`);
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
    this.toast.success('File ready', `${file.name} loaded successfully.`);
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
  }

  setMode(mode: 'text' | 'pdf'): void {
    this.inputMode = mode;
    this.result = null;
    this.fileMeta = null;
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

  riskClass(level: string): string {
    return level ? 'risk-' + level.toLowerCase() : 'risk-medium';
  }

  clauseCountByRisk(level: string): number {
    if (!this.result?.clauses) return 0;
    return this.result.clauses.filter(
      (c: any) => c.riskLevel?.toLowerCase() === level.toLowerCase()
    ).length;
  }

  confidencePct(score: number): number {
    return Math.round((score || 0) * 100);
  }

  confidenceColor(score: number): string {
    if (score >= 0.8) return 'var(--risk-low)';
    if (score >= 0.6) return 'var(--risk-medium)';
    return 'var(--risk-critical)';
  }

  analyzeContract(): void {
    // Client-side validation with toast
    if (this.inputMode === 'text') {
      if (!this.contractText.trim()) {
        this.toast.warning('Empty input', 'Please paste contract text before analyzing.');
        return;
      }
      if (this.contractText.trim().length < 20) {
        this.toast.warning(
          'Text too short',
          `Contract text needs at least 20 characters. Currently ${this.contractText.trim().length}.`
        );
        return;
      }
    }

    if (this.inputMode === 'pdf' && !this.selectedFile) {
      this.toast.warning('No file selected', 'Please select a PDF file to analyze.');
      return;
    }

    this.loading = true;
    this.result = null;
    this.fileMeta = null;
    this.loadingStep = 0;

    this.toast.info('Analysis started', 'Your contract is being analyzed. This takes 10–20 seconds.');

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

        // Smart success toast based on result
        const risk = res.result?.overallRisk;
        const conf = this.confidencePct(res.result?.confidenceScore);
        const clauseCount = res.result?.clauses?.length || 0;

        if (res.result?.requiresHumanReview) {
          this.toast.warning(
            'Analysis complete — Review needed',
            `${clauseCount} clauses analyzed. Confidence ${conf}% is below threshold.`
          );
        } else {
          this.toast.success(
            `Analysis complete (${risk} risk)`,
            `${clauseCount} clauses analyzed with ${conf}% confidence in ${(res.result?.processingTimeMs / 1000).toFixed(1)}s.`
          );
        }

        this.cdr.detectChanges();
        setTimeout(() => {
          document.querySelector('.results-dashboard')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      });
    };

    const fail = (err: any) => {
      this.ngZone.run(() => {
        clearInterval(this.loadingTimer);
        this.loading = false;
        this.toast.fromHttpError(err, 'Analysis failed');
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
    try {
      const blob = new Blob([JSON.stringify(this.result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract_analysis_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast.success('Downloaded', 'Analysis saved as JSON file.');
    } catch {
      this.toast.error('Download failed', 'Could not create download file.');
    }
  }

  newAnalysis(): void {
    this.result = null;
    this.fileMeta = null;
    this.contractText = '';
    this.selectedFile = null;
    this.toast.info('Ready for new analysis', 'Upload another contract to continue.');
  }
}