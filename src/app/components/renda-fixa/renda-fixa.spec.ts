import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RendaFixa } from './renda-fixa';

describe('RendaFixa', () => {
  let component: RendaFixa;
  let fixture: ComponentFixture<RendaFixa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RendaFixa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RendaFixa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
