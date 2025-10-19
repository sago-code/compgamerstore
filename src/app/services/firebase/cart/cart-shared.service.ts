import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartService } from 'src/app/services/firebase/cart/cart.service';

@Injectable({ providedIn: 'root' })
export class CartSharedService {
  itemsCount$: Observable<number>;

  constructor(private cartService: CartService) {
    this.itemsCount$ = this.cartService.cart$.pipe(
      map(cart => cart.items.reduce((sum, i) => sum + i.quantity, 0))
    );
  }
}