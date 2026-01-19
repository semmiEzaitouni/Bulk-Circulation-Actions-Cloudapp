import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionSelectComponent } from './action-select.component';

describe('ActionSelectComponent', () => {
  let component: ActionSelectComponent;
  let fixture: ComponentFixture<ActionSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
