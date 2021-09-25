import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AgendaEditBlockComponent} from './agenda-edit-block.component';

describe('AgendaEditBlockComponent', () => {
  let component: AgendaEditBlockComponent;
  let fixture: ComponentFixture<AgendaEditBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgendaEditBlockComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgendaEditBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
