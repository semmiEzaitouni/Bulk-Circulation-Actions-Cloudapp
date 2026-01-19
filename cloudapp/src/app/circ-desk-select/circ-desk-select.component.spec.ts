import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircDeskSelectComponent } from './circ-desk-select.component';

describe('CircDeskSelectComponent', () => {
  let component: CircDeskSelectComponent;
  let fixture: ComponentFixture<CircDeskSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircDeskSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircDeskSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
