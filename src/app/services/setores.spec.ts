import { TestBed } from '@angular/core/testing';

import { Setores } from './setores';

describe('Setpres', () => {
  let service: Setores;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Setores);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
