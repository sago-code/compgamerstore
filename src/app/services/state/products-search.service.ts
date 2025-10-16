import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Product } from 'src/app/models/product.model';
import { ProductsService } from 'src/app/services/firebase/products/products.service';

@Injectable({ providedIn: 'root' })
export class ProductsSearchService {
  private term$ = new BehaviorSubject<string>('');
  private refresh$ = new BehaviorSubject<void>(undefined);

  constructor(private productsService: ProductsService) {}

  setTerm(term: string): void {
    this.term$.next(term ?? '');
  }

  clear(): void {
    this.term$.next('');
  }

  refresh(): void {
    this.refresh$.next(undefined);
  }

  get results$(): Observable<Product[]> {
    return combineLatest([
      this.term$.pipe(
        map(t => (t ?? '').trim()),
        debounceTime(250),
        distinctUntilChanged()
      ),
      this.refresh$
    ]).pipe(
      switchMap(([term]) =>
        term
          ? this.productsService.searchProducts(term)
          : this.productsService.getProducts()
      ),
      map(products => this.sortProducts(products))
    );
  }

  private sortProducts(products: Product[]): Product[] {
    return [...products].sort((a, b) => {
      const dateA = a.created_at ? (a.created_at as any).toDate?.() || new Date(0) : new Date(0);
      const dateB = b.created_at ? (b.created_at as any).toDate?.() || new Date(0) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }
}