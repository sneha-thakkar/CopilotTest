import { TestBed } from '@angular/core/testing';
import { HealthComponent } from './health.component';

describe('HealthComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HealthComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HealthComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render the health heading', () => {
    const fixture = TestBed.createComponent(HealthComponent);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h2') as HTMLElement;
    expect(heading?.textContent).toContain('Health Check');
  });
});
