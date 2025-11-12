import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DataService } from '../../services/data';
import { COUNTRY_REGION_MAP, UNIQUE_REGIONS } from '../../data/regions';

interface PopulationRecord {
  country: string;
  country_code?: string;
  population: number;
  region: string;
}

interface PopulationApiResponse {
  bucket?: string;
  key?: string;
  row_count?: number;
  rows?: PopulationRecord[];
}
@Component({
  selector: 'app-population',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSliderModule,
    MatCardModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatButtonToggleModule,
    NgChartsModule
  ],
  templateUrl: './population.html',
  styleUrls: ['./population.css']
})
export class PopulationComponent implements OnInit {
  @ViewChild(MatPaginator)
  set matPaginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }

  @ViewChild(MatSort)
  set matSort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  populationData: PopulationRecord[] = [];
  dataSource = new MatTableDataSource<PopulationRecord>([]);
  searchText: string = '';
  selectedRegion: string = 'All';
  minPopulation: number = 0;
  maxPopulation: number = 0;
  displayedColumns: string[] = ['country', 'population'];
  regionOptions = ['All', ...UNIQUE_REGIONS];
  loading = false;
  error: string = '';
  lastRefreshed: Date | null = null;
  totalCountries = 0;
  meta: { bucket?: string; key?: string; rowCount?: number } = {};
  darkMode = false;
  tableDensity: 'comfortable' | 'compact' = 'comfortable';

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Top 10 Countries by Population', backgroundColor: '#3f51b5' }
    ],
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'bottom' }
    },
    scales: {
      x: { title: { display: true, text: 'Country' } },
      y: { title: { display: true, text: 'Population' } }
    }
  };

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Population Trend (Top 10)',
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255,152,0,0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'bottom' }
    },
    scales: {
      x: { title: { display: true, text: 'Country' } },
      y: { title: { display: true, text: 'Population' } }
    }
  };

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#3f51b5', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#607d8b'],
        hoverBackgroundColor: ['#5c6bc0', '#42a5f5', '#66bb6a', '#ffb74d', '#ba68c8', '#78909c']
      }
    ]
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  constructor(private dataService: DataService, @Inject(DOCUMENT) private document: Document) {}

  ngOnInit() {
    this.dataSource.filterPredicate = (data: PopulationRecord, filterText: string) => {
      if (!filterText) {
        return true;
      }
      const filter = JSON.parse(filterText);
      const matchesSearch = data.country.toLowerCase().includes(filter.searchText);
      const matchesRegion = filter.selectedRegion === 'All' || data.region === filter.selectedRegion;
      const matchesPopulation = data.population >= filter.minPopulation;
      return matchesSearch && matchesRegion && matchesPopulation;
    };
    this.applyThemeClass();
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    this.error = '';
    this.dataService.getPopulationData().subscribe({
      next: (data: PopulationApiResponse | PopulationRecord[]) => {
        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data.rows)
            ? data.rows
            : [];

        this.populationData = rows.map((row) => ({
          ...row,
          population: Number(row.population) || 0,
          region: this.resolveRegion(row.country_code)
        }));
        this.maxPopulation = this.getMaxPopulation();
        this.totalCountries = this.populationData.length;
        if (!Array.isArray(data)) {
          this.meta = { bucket: data.bucket, key: data.key, rowCount: data.row_count };
        } else {
          this.meta = {};
        }
        this.lastRefreshed = new Date();
        this.dataSource.data = this.populationData;
        this.applyFilters();
        console.log('Population data loaded:', this.populationData);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching population data:', err);
        this.error = 'Unable to load population data. Please try again.';
        this.loading = false;
      }
    });
  }

  refresh() {
    this.fetchData();
  }

  onThemeToggle(checked: boolean) {
    this.darkMode = checked;
    this.applyThemeClass();
  }

  onDensityChange(value: 'comfortable' | 'compact') {
    this.tableDensity = value;
  }

  get tableDensityClass() {
    return this.tableDensity === 'compact' ? 'table-compact' : 'table-comfortable';
  }

  private applyThemeClass() {
    if (!this.document) {
      return;
    }
    this.document.body.classList.toggle('dark-mode', this.darkMode);
  }

  private updateCharts(dataSet: PopulationRecord[] = this.populationData) {
    const topTen = [...dataSet]
      .filter((d) => d.population)
      .sort((a, b) => b.population - a.population)
      .slice(0, 10);

    this.barChartData = {
      ...this.barChartData,
      labels: topTen.map((c) => c.country),
      datasets: [
        {
          ...this.barChartData.datasets[0],
          data: topTen.map((c) => c.population)
        }
      ]
    };

    this.lineChartData = {
      labels: topTen.map((c) => c.country),
      datasets: [
        {
          ...this.lineChartData.datasets[0],
          data: topTen.map((c) => c.population)
        }
      ]
    };

    const topFive = topTen.slice(0, 5);
    const topFiveSum = topFive.reduce((sum, item) => sum + (item.population || 0), 0);
    const grandTotal = this.populationData.reduce((sum, item) => sum + (item.population || 0), 0);
    const otherTotal = Math.max(grandTotal - topFiveSum, 0);

    this.pieChartData = {
      labels: [...topFive.map((c) => c.country), 'Other'],
      datasets: [
        {
          ...this.pieChartData.datasets[0],
          data: [...topFive.map((c) => c.population), otherTotal]
        }
      ]
    };
  }

  applyFilters() {
    const filterValue = JSON.stringify({
      searchText: this.searchText.trim().toLowerCase(),
      selectedRegion: this.selectedRegion,
      minPopulation: this.minPopulation
    });
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    const filtered = this.dataSource.filteredData?.length ? this.dataSource.filteredData : this.populationData;
    this.updateCharts(filtered);
  }

  onRegionChange(region: string) {
    this.selectedRegion = region;
    this.applyFilters();
  }

  onPopulationChange() {
    this.applyFilters();
  }

  private resolveRegion(code?: string): string {
    if (!code) {
      return 'Unknown';
    }
    return COUNTRY_REGION_MAP[code] || 'Unknown';
  }

  private getMaxPopulation(): number {
    return this.populationData.reduce((max, item) => Math.max(max, item.population || 0), 0);
  }
}
