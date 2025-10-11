import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fiis } from './fiis';

describe('Fiis', () => {
  let component: Fiis;
  let fixture: ComponentFixture<Fiis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fiis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Fiis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
