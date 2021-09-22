import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AgendaTimeBlockComponent} from './agenda-time-block.component';

describe('AgendaTimeBlockComponent', () => {
  let component: AgendaTimeBlockComponent;
  let fixture: ComponentFixture<AgendaTimeBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgendaTimeBlockComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgendaTimeBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
