import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BlockEditorComponent} from './block.component';

describe('BlockComponent', () => {
  let component: BlockEditorComponent;
  let fixture: ComponentFixture<BlockEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BlockEditorComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
