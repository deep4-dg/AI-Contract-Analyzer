import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContractService {

  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  signup(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/signup`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, data);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
  }

  analyzeContract(contractText: string, language: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/contracts/analyze`,
      { contractText, language },
      { headers: this.getHeaders() }
    );
  }

  compareContracts(oldContract: string, newContract: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/contracts/compare`,
      { oldContract, newContract },
      { headers: this.getHeaders() }
    );
  }

  extractClauses(contractText: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/contracts/extract-clauses`,
      { contractText },
      { headers: this.getHeaders() }
    );
  }

  getDashboard(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard`,
      { headers: this.getHeaders() }
    );
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/admin/settings`,
      settings,
      { headers: this.getHeaders() }
    );
  }

  exportAuditLogs(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/admin/audit-logs/export`,
      {
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    );
  }
}