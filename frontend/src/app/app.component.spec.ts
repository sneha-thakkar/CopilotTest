import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render navigation links', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const labels = links.map((link) => link.textContent?.trim());
    expect(labels).toContain('Tasks');
    expect(labels).toContain('Home');
    expect(labels).toContain('Health');
  });
});
