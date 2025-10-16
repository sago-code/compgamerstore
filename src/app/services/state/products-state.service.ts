import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ProductFormMode = 'create' | 'edit';

@Injectable({ providedIn: 'root' })
export class ProductsStateService {
  private mode$ = new BehaviorSubject<ProductFormMode>('create');
  private productId$ = new BehaviorSubject<string | null>(null);
  private type$ = new BehaviorSubject<string | null>(null);

  setMode(mode: ProductFormMode): void {
    this.mode$.next(mode);
  }

  setProductId(uid: string | null): void {
    this.productId$.next(uid);
  }

  setType(type: string | null): void {
    this.type$.next(type);
  }

  clear(): void {
    this.mode$.next('create');
    this.productId$.next(null);
    this.type$.next(null);
  }

  getMode$(): Observable<ProductFormMode> {
    return this.mode$.asObservable();
  }

  getProductId$(): Observable<string | null> {
    return this.productId$.asObservable();
  }

  getType$(): Observable<string | null> {
    return this.type$.asObservable();
  }

  getCurrentMode(): ProductFormMode {
    return this.mode$.getValue();
  }

  getCurrentProductId(): string | null {
    return this.productId$.getValue();
  }

  getCurrentType(): string | null {
    return this.type$.getValue();
  }
}