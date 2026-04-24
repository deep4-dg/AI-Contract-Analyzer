import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../services/contract';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-contract-compare',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-compare.html',
  styleUrls: ['./contract-compare.css']
})
export class ContractCompareComponent {

  oldContract = '';
  newContract = '';
  result: any = null;
  loading = false;

  constructor(
    private contractService: ContractService,
    private toast: ToastService
  ) {}

  compareContracts() {
    // Validation with toast
    if (!this.oldContract.trim() || this.oldContract.trim().length < 20) {
      this.toast.warning('Old contract required', 'Please paste the original contract text (minimum 20 characters).');
      return;
    }
    if (!this.newContract.trim() || this.newContract.trim().length < 20) {
      this.toast.warning('New contract required', 'Please paste the new contract text (minimum 20 characters).');
      return;
    }

    this.loading = true;
    this.toast.info('Comparing contracts', 'This takes 10–20 seconds.');

    this.contractService.compareContracts(this.oldContract, this.newContract).subscribe({
      next: (res: any) => {
        this.result = res.result;
        this.loading = false;
        const changeCount = res.result?.changes?.length || 0;
        this.toast.success(
          'Comparison complete',
          `Found ${changeCount} change${changeCount === 1 ? '' : 's'} between versions.`
        );
      },
      error: (err: any) => {
        this.loading = false;
        this.toast.fromHttpError(err, 'Comparison failed');
      }
    });
  }
}