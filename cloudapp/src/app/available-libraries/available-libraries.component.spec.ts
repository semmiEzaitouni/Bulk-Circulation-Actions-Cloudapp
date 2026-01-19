import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailableLibrariesComponent } from './available-libraries.component';

describe('AvailableLibrariesComponent', () => {
  let component: AvailableLibrariesComponent;
  let fixture: ComponentFixture<AvailableLibrariesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailableLibrariesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvailableLibrariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
