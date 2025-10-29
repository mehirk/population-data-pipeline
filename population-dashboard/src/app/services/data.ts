import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'https://population-data-pipeline.onrender.com/population'; // Endpoint served by the FastAPI backend on Render

  constructor(private http: HttpClient) {}

  getPopulationData(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
