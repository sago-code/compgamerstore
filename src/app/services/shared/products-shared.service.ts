import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProductsService } from 'src/app/services/firebase/products/products.service';
import { Product } from 'src/app/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsSharedService {
  private typeSubject = new BehaviorSubject<string>('hardware');
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  type$ = this.typeSubject.asObservable();
  products$ = this.productsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  private cache = new Map<string, Product[]>();

  constructor(private productsService: ProductsService) {}

  async setType(type: string) {
    const normalized = (type || 'hardware').toLowerCase();
    this.typeSubject.next(normalized);

    if (this.cache.has(normalized)) {
      this.productsSubject.next(this.cache.get(normalized)!);
      this.loadingSubject.next(false);
      return;
    }

    await this.loadByType(normalized);
  }

  async refresh(): Promise<void> {
    const type = this.typeSubject.value;
    await this.loadByType(type);
  }

  private async loadByType(type: string): Promise<void> {
    this.loadingSubject.next(true);
    try {
      const products = await this.productsService.getProductsByType(type);
      this.cache.set(type, products);
      this.productsSubject.next(products);
    } catch (err) {
      console.error('Error cargando productos por tipo:', type, err);
      this.productsSubject.next([]);
    } finally {
      this.loadingSubject.next(false);
    }
  }
}