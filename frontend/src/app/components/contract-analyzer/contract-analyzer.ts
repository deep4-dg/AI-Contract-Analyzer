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

  contractText = '';
  language = 'English';

  loading = false;
  error = '';
  result: any = null;

  constructor(private contractService: ContractService) {}

  analyzeContract() {
    this.loading = true;
    this.error = '';
    this.result = null;

    this.contractService.analyzeContract(this.contractText, this.language)
      .subscribe({
        next: (res) => {
          this.result = res.result;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to analyze contract';
          this.loading = false;
        }
      });
  }
}