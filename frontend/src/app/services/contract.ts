import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContractService {

  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  // ── Auth ──────────────────────────────────────────────────────────────────
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

  // ── Analyze: plain text ───────────────────────────────────────────────────
  analyzeContract(contractText: string, language: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/contracts/analyze`,
      { contractText, language },
      { headers: this.getHeaders() }
    );
  }

  // ── Analyze: PDF file upload ──────────────────────────────────────────────
  // Sends multipart/form-data — DO NOT set Content-Type manually.
  // The browser sets it automatically with the correct boundary.
  analyzeContractFile(file: File, language: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    return this.http.post(
      `${this.apiUrl}/contracts/analyze-file`,
      formData,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.getToken() ?? ''}`
        })
      }
    );
  }

  // ── Compare two contract versions ─────────────────────────────────────────
  compareContracts(oldContract: string, newContract: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/contracts/compare`,
      { oldContract, newContract },
      { headers: this.getHeaders() }
    );
  }

  // ── Extract clauses only (fast, no full analysis) ─────────────────────────
  extractClauses(contractText: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/contracts/extract-clauses`,
      { contractText },
      { headers: this.getHeaders() }
    );
  }

  // ── Admin: dashboard stats ────────────────────────────────────────────────
  getDashboard(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard`,
      { headers: this.getHeaders() }
    );
  }

  // ── Admin: update runtime settings (confidence threshold, rate limit) ─────
  updateSettings(settings: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/admin/settings`,
      settings,
      { headers: this.getHeaders() }
    );
  }

  // ── Admin: export audit logs as CSV (with optional date range) ────────────
  exportAuditLogs(from?: string, to?: string): Observable<Blob> {
    let url = `${this.apiUrl}/admin/audit-logs/export`;
    const params: string[] = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length) url += `?${params.join('&')}`;

    return this.http.get(url, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
}