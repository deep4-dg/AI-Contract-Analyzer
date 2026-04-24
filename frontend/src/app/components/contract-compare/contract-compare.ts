import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../services/contract';

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

  constructor(private contractService: ContractService) {}

  compareContracts() {
    this.loading = true;

    this.contractService.compareContracts(this.oldContract, this.newContract)
      .subscribe({
        next: (res) => {
          this.result = res.result;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }
}