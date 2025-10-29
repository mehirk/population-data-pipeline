import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:8000/population'; // Endpoint served by the FastAPI backend

  constructor(private http: HttpClient) {}

  getPopulationData(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
