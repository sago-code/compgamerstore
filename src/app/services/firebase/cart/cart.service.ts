import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { Product, Cart, CartItem } from 'src/app/models/product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private app: FirebaseApp;
  private db: Firestore;

  private cartSubject = new BehaviorSubject<Cart>({
    id: 'local',
    userId: null,
    status: 'active',
    items: [],
    subtotal: 0,
    total: 0,
    currency: 'USD',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  cart$ = this.cartSubject.asObservable();
  private readonly LOCAL_CART_KEY = 'compgamer_cart';

  constructor() {
    this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.db = getFirestore(this.app);
    this.hydrateFromLocal();
  }

  // Lectura rápida del estado
  getCart(): Cart {
    return this.cartSubject.value;
  }

  getQuantity(productId: string): number {
    const item = this.cartSubject.value.items.find(i => i.productId === productId);
    return item?.quantity ?? 0;
  }

  addProduct(product: Product, qty: number = 1): void {
    const cart = this.getCart();
    const existing = cart.items.find(i => i.productId === product.uid);

    if (existing) {
      existing.quantity += qty;
      existing.unitPrice = product.price; // refresca a precio actual
    } else {
      cart.items.push({
        productId: product.uid,
        name: product.product_name,
        image: product.product_image,
        quantity: qty,
        unitPrice: product.price,
        currency: 'USD',
        type: product.type,
        added_at: serverTimestamp(),
      });
    }

    this.recalcAndEmit();
  }

  addOne(productId: string): void {
    const cart = this.getCart();
    const existing = cart.items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity += 1;
      this.recalcAndEmit();
    }
  }

  removeOne(productId: string): void {
    const cart = this.getCart();
    const existing = cart.items.find(i => i.productId === productId);
    if (!existing) return;

    existing.quantity -= 1;
    if (existing.quantity <= 0) {
      cart.items = cart.items.filter(i => i.productId !== productId);
    }
    this.recalcAndEmit();
  }

  setQuantity(productId: string, qty: number): void {
    if (qty <= 0) return this.removeItem(productId);
    const cart = this.getCart();
    const existing = cart.items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity = qty;
      this.recalcAndEmit();
    }
  }

  removeItem(productId: string): void {
    const cart = this.getCart();
    cart.items = cart.items.filter(i => i.productId !== productId);
    this.recalcAndEmit();
  }

  clear(): void {
    const cart = this.getCart();
    cart.items = [];
    this.recalcAndEmit();
  }

  // Persistencia opcional en Firestore (por usuario)
  async loadFromFirestore(cartId: string): Promise<void> {
    const ref = doc(this.db, 'carts', cartId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Cart;
      this.cartSubject.next(data);
      this.persistLocal();
    } else {
      await setDoc(ref, { ...this.getCart(), id: cartId, created_at: serverTimestamp(), updated_at: serverTimestamp() });
      this.cartSubject.next({ ...this.getCart(), id: cartId });
      this.persistLocal();
    }
  }

  async saveToFirestore(cartId: string, userId: string | null = null): Promise<void> {
    const cart = { ...this.getCart(), id: cartId, userId, updated_at: serverTimestamp() };
    await setDoc(doc(this.db, 'carts', cartId), cart, { merge: true });
  }

  private recalcAndEmit(): void {
    const cart = this.getCart();
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    cart.total = cart.subtotal;
    cart.updated_at = serverTimestamp();
    this.cartSubject.next({ ...cart });
    this.persistLocal();
    if (cart.userId) {
      this.saveToFirestore(cart.userId, cart.userId).catch(() => {});
    }
  }

  async setUserId(userId: string): Promise<void> {
    const current = this.cartSubject.value;
    if (current.userId === userId) return;

    // establece userId y sincroniza con Firestore (merge con local)
    this.cartSubject.next({ ...current, userId, updated_at: serverTimestamp() });
    await this.syncWithFirestore(userId);
  }

  private persistLocal(): void {
    const cart = this.getCart();
    const plain: any = {
      ...cart,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    try {
      localStorage.setItem(this.LOCAL_CART_KEY, JSON.stringify(plain));
    } catch { /* noop */ }
  }

  private hydrateFromLocal(): void {
    try {
      const raw = localStorage.getItem(this.LOCAL_CART_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const restored: Cart = {
        ...this.getCart(),
        ...parsed,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      this.cartSubject.next(restored);
    } catch { /* noop */ }
  }

  private async getCartFromFirestore(cartId: string): Promise<Cart | null> {
    try {
      const ref = doc(this.db, 'carts', cartId);
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as Cart) : null;
    } catch {
      return null;
    }
  }

  private mergeCarts(primary: Cart, secondary: Cart): Cart {
    // primary (server) tiene preferencia base; secondary (local) se suma
    const map = new Map<string, CartItem>();
    for (const i of primary.items) map.set(i.productId, { ...i });
    for (const j of secondary.items) {
      const existing = map.get(j.productId);
      if (existing) {
        map.set(j.productId, {
          ...existing,
          quantity: existing.quantity + j.quantity,
          unitPrice: j.unitPrice ?? existing.unitPrice,
        });
      } else {
        map.set(j.productId, { ...j });
      }
    }
    const items = Array.from(map.values());
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return {
      ...primary,
      items,
      subtotal,
      total: subtotal,
      updated_at: serverTimestamp(),
    };
  }

  private async syncWithFirestore(userId: string): Promise<void> {
    const local = this.getCart();
    const server = await this.getCartFromFirestore(userId);
    const base: Cart = server ?? { ...local, id: userId, userId, created_at: serverTimestamp(), updated_at: serverTimestamp() };
    const merged = this.mergeCarts(base, local);
    const finalCart = { ...merged, id: userId, userId };
    this.cartSubject.next(finalCart);
    this.persistLocal();
    await this.saveToFirestore(userId, userId);
  }
}