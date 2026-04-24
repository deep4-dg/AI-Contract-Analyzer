import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractCompare } from './contract-compare';

describe('ContractCompare', () => {
  let component: ContractCompare;
  let fixture: ComponentFixture<ContractCompare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractCompare],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractCompare);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
