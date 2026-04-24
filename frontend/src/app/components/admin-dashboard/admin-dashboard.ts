import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractService } from '../../services/contract';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {

  dashboard: any = null;

  constructor(private contractService: ContractService) {}

  ngOnInit() {
    this.contractService.getDashboard().subscribe((res) => {
      this.dashboard = res;
    });
  }
}