import { TestBed } from '@angular/core/testing';

import { Acoes } from './acoes';

describe('Acoes', () => {
  let service: Acoes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Acoes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
