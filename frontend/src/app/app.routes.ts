import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { ContractAnalyzerComponent } from './components/contract-analyzer/contract-analyzer';
import { ContractCompareComponent } from './components/contract-compare/contract-compare';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  { path: 'home', component: ContractAnalyzerComponent },
  { path: 'home/compare', component: ContractCompareComponent },
  { path: 'home/admin', component: AdminDashboardComponent },

  { path: '**', redirectTo: 'login' }
];