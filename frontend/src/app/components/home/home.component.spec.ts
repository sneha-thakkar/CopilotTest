import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render the welcome heading', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(heading?.textContent).toContain('Welcome');
  });
});
