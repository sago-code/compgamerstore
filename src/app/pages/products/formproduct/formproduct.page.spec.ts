import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormproductPage } from './formproduct.page';

describe('FormproductPage', () => {
  let component: FormproductPage;
  let fixture: ComponentFixture<FormproductPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FormproductPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
