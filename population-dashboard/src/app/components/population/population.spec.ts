import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Population } from './population';

describe('Population', () => {
  let component: Population;
  let fixture: ComponentFixture<Population>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Population]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Population);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
