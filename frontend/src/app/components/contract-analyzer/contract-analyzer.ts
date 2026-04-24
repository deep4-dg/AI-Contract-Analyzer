import { Component } from '@angular/core';
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

  constructor(private contractService: ContractService) {}

  // ── Handle file selected from the file input ──────────────────────────────
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

  // ── Handle file dropped onto the drop zone ────────────────────────────────
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

  // ── Remove selected file ──────────────────────────────────────────────────
  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
  }

  // ── Switch between text and PDF modes ─────────────────────────────────────
  setMode(mode: 'text' | 'pdf'): void {
    this.inputMode = mode;
    this.result = null;
    this.error = '';
    if (mode === 'text') this.selectedFile = null;
    if (mode === 'pdf') this.contractText = '';
  }

  // ── Button is disabled unless there's valid input ─────────────────────────
  get canSubmit(): boolean {
    if (this.loading) return false;
    if (this.inputMode === 'text') return this.contractText.trim().length >= 20;
    if (this.inputMode === 'pdf') return this.selectedFile !== null;
    return false;
  }

  // ── Main submit handler ───────────────────────────────────────────────────
  analyzeContract(): void {
    this.loading = true;
    this.error = '';
    this.result = null;

    if (this.inputMode === 'pdf' && this.selectedFile) {
      // PDF mode — send file via FormData
      this.contractService
        .analyzeContractFile(this.selectedFile, this.language)
        .subscribe({
          next: (res: any) => {
            this.result = res.result;
            this.loading = false;
          },
          error: (err: any) => {
            this.error = err?.error?.error || 'Failed to analyze PDF. Please try again.';
            this.loading = false;
          }
        });
    } else {
      // Text mode — send plain contractText
      this.contractService
        .analyzeContract(this.contractText, this.language)
        .subscribe({
          next: (res: any) => {
            this.result = res.result;
            this.loading = false;
          },
          error: (err: any) => {
            this.error = err?.error?.error || 'Failed to analyze contract. Please try again.';
            this.loading = false;
          }
        });
    }
  }
}