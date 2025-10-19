import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/firebase/cart/cart.service';
import { ProductsService } from '../../services/firebase/products/products.service';
import { SessionService } from '../../services/session.service';
import { Router } from '@angular/router';
import { Cart, CartItem } from '../../models/product.model';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: false
})
export class CartPage implements OnInit, OnDestroy {
  cart: Cart | null = null;
  isLoggedIn = false;
  userUid: string | null = null;
  private sub?: Subscription;
  private images: Record<string, string> = {};

  constructor(
    private cartService: CartService,
    private productsService: ProductsService,
    private sessionService: SessionService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.sub = this.cartService.cart$.subscribe(async (cart) => {
      this.cart = cart;
      await this.loadSession();
      if (cart && cart.items.length) {
        this.ensureProductImages(cart.items);
      }
    });
  }

  async ionViewWillEnter() {
    await this.loadSession();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get isEmpty(): boolean {
    return !this.cart || this.cart.items.length === 0;
  }

  trackByProduct(index: number, item: CartItem): string {
    return item.productId;
  }

  increase(item: CartItem): void {
    this.cartService.addOne(item.productId);
  }

  decrease(item: CartItem): void {
    this.cartService.removeOne(item.productId);
  }

  remove(item: CartItem): void {
    this.cartService.removeItem(item.productId);
  }

  clear(): void {
    this.cartService.clear();
  }

  checkout(): void {
    // Sólo disponible si hay sesión
    if (!this.isLoggedIn) return;
    console.log('Checkout con carrito:', this.cart);
    // Aquí conectar flujo de órdenes/pago
  }

  goToLogin(): void {
    // Ajusta la ruta de login si es distinta en tu app
    this.router.navigateByUrl('/login');
  }

  productImage(productId: string): string {
    return this.images[productId] || 'assets/placeholder-product.png';
  }

  private async ensureProductImages(items: CartItem[]) {
    for (const item of items) {
      const id = item.productId;
      if (!this.images[id]) {
        try {
          const product = await this.productsService.getProductByUid(id);
          this.images[id] = product?.product_image || 'assets/placeholder-product.png';
        } catch {
          this.images[id] = 'assets/placeholder-product.png';
        }
      }
    }
  }

  private async loadSession() {
    try {
      const session = await this.sessionService.getSession();
      const uid = session?.uid ?? null;
      this.isLoggedIn = !!uid;
      this.userUid = uid;
    } catch {
      // ignore
    }

    if (!this.isLoggedIn) {
      const fallbackUid = this.resolveUserFromStorage();
      this.isLoggedIn = !!fallbackUid;
      this.userUid = fallbackUid;
    }

    if (this.isLoggedIn && this.userUid) {
      await this.cartService.setUserId(this.userUid);
    }
  }

  private resolveUserFromStorage(): string | null {
    const keys = ['session', 'user', 'account', 'auth', 'firebaseUser'];
    for (const key of keys) {
      try {
        const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        const uid = obj?.uid || obj?.id || obj?.userId || null;
        if (uid) return String(uid);
      } catch {
        // ignore
      }
    }
    return null;
  }
}
