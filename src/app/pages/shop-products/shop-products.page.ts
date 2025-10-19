import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { ProductsSharedService } from 'src/app/services/shared/products-shared.service';
import { Product } from 'src/app/models/product.model';
import { CartService } from 'src/app/services/firebase/cart/cart.service';

@Component({
  selector: 'app-shop-products',
  templateUrl: './shop-products.page.html',
  styleUrls: ['./shop-products.page.scss'],
  standalone: false
})
export class ShopProductsPage implements OnInit, OnDestroy {
  type: string = 'hardware';
  products: Product[] = [];
  loading = true;

  private sub?: Subscription;
  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private productsShared: ProductsSharedService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    // Escucha cambios de query param `type`
    this.routeSub = this.route.queryParams.subscribe(async (params) => {
      const t = (params['type'] || 'hardware').toLowerCase();
      this.type = t;
      await this.productsShared.setType(t);
    });

    // Vincula productos y loading del servicio compartido
    this.sub = combineLatest([
      this.productsShared.products$,
      this.productsShared.loading$
    ]).subscribe(([items, loading]) => {
      this.products = items || [];
      this.loading = loading;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  trackByUid(index: number, item: Product): string {
    return item.uid;
  }

  // Controles del carrito
  increaseQty(product: Product) {
    this.cartService.addProduct(product, 1);
  }

  decreaseQty(product: Product) {
    this.cartService.removeOne(product.uid);
  }

  cartQuantity(productId: string): number {
    return this.cartService.getQuantity(productId);
  }
}
