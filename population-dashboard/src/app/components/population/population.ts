import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data';

@Component({
  selector: 'app-population',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './population.html',
  styleUrls: ['./population.css']
})
export class PopulationComponent implements OnInit {
  populationData: any[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getPopulationData().subscribe({
      next: (data) => {
        this.populationData = data.rows || data;
        console.log('Population data loaded:', this.populationData);
      },
      error: (err) => console.error('Error fetching population data:', err)
    });
  }
}
