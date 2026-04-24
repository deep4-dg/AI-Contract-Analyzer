import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractAnalyzer } from './contract-analyzer';

describe('ContractAnalyzer', () => {
  let component: ContractAnalyzer;
  let fixture: ComponentFixture<ContractAnalyzer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractAnalyzer],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractAnalyzer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
