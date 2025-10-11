import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Acoes } from './acoes';

describe('Acoes', () => {
  let component: Acoes;
  let fixture: ComponentFixture<Acoes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Acoes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Acoes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
