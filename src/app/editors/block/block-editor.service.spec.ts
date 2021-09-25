import {TestBed} from '@angular/core/testing';

import {BlockEditorService} from './block-editor.service';

describe('BlockEditorService', () => {
  let service: BlockEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BlockEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
