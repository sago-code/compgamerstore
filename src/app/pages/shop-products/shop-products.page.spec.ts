import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShopProductsPage } from './shop-products.page';

describe('ShopProductsPage', () => {
  let component: ShopProductsPage;
  let fixture: ComponentFixture<ShopProductsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ShopProductsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
