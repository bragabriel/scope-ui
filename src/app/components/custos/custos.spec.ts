import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Custos } from './custos';

describe('Custos', () => {
  let component: Custos;
  let fixture: ComponentFixture<Custos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Custos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Custos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
