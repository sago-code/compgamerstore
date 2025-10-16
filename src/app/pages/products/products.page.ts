import { Component, ElementRef, OnDestroy, Renderer2, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonInput, AlertController  } from '@ionic/angular';
import { ProductsService } from '../../services/firebase/products/products.service';
import { HardwareProduct, Product } from 'src/app/models/product.model';
import { LoadingService } from 'src/app/loading-service';
import { Subscription } from 'rxjs';
import { ProductsSearchService } from 'src/app/services/state/products-search.service';
import { ProductsStateService } from 'src/app/services/state/products-state.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: false
})
export class ProductsPage implements OnInit, OnDestroy {
  searchActive = false;
  pageTitle = 'Productos';
  private removeClickListener: (() => void) | null = null;
  private productsSub?: Subscription;

  @ViewChild('searchInput', { read: IonInput }) searchInput!: IonInput;
  @ViewChild('header') headerRef!: ElementRef<HTMLElement>;

  products: Product[] = [];
  allProducts: Product[] = [];
  currentType: string | null = null;

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private router: Router,
    private productsService: ProductsService,
    private loadingService: LoadingService,
    private alertController: AlertController,
    private productsSearch: ProductsSearchService,
    private productsState: ProductsStateService
  ) {}

  ngOnInit() {
    // 1. Suscripción al buscador centralizado
    this.productsSub = this.productsSearch.results$.subscribe({
      next: (list) => {
        this.allProducts = list;
        this.applyFilter();
      },
      error: (err) => console.error('Error searching products:', err),
    });

    // 2. Escucho cambios en queryParams y filtro
    this.route.queryParams.subscribe(params => {
      this.currentType = params['type'] || null;
      this.applyFilter();
    });
  }

  // Nuevo: refresca la lista cuando la página será mostrada nuevamente
  ionViewWillEnter() {
    this.productsSearch.refresh();
    // Si filtras por tipo en queryParams, esto asegura re-fetch y re-aplicación del filtro
    this.applyFilter();
  }

  async loadProducts() {
    try {
      this.allProducts = await this.productsService.getProducts();
      // Ordenar por fecha de creación (más reciente primero)
      this.allProducts.sort((a, b) => {
        const dateA = a.created_at ? (a.created_at as any).toDate?.() || new Date(0) : new Date(0);
        const dateB = b.created_at ? (b.created_at as any).toDate?.() || new Date(0) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      this.applyFilter(); // aplico filtro apenas termine la carga
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }

  applyFilter() {
    if (this.currentType) {
      this.products = this.allProducts.filter(p => p.type === this.currentType);
      this.pageTitle = `Productos - ${this.capitalize(this.currentType)}`;
    } else {
      this.products = [...this.allProducts];
      this.pageTitle = 'Productos';
    }
  }

  capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  activarBusqueda() {
    this.searchActive = !this.searchActive;
    if (this.searchActive) {
      setTimeout(async () => {
        const nativeInput = await this.searchInput.getInputElement();
        nativeInput.focus();
      });

      this.removeClickListener = this.renderer.listen('document', 'mousedown', (event) => {
        if (this.headerRef && !this.headerRef.nativeElement.contains(event.target as Node)) {
          this.cerrarBusqueda();
        }
      });
    } else {
      this.cerrarBusqueda();
    }
  }

  onSearchInput(evt: Event) {
    const ce = evt as CustomEvent<{ value: string }>;
    const value =
      (ce.detail && typeof ce.detail.value === 'string' ? ce.detail.value : '') ||
      ((evt.target as HTMLInputElement)?.value ?? '');
    this.productsSearch.setTerm(value);
  }

  cerrarBusqueda() {
    this.searchActive = false;
    setTimeout(async () => {
      if (this.searchInput) {
        this.searchInput.value = '';
        const nativeInput = await this.searchInput.getInputElement();
        nativeInput.blur();
      }
    }, 0);

    // Reinicia el término de búsqueda
    this.productsSearch.clear();

    if (this.removeClickListener) {
      this.removeClickListener();
      this.removeClickListener = null;
    }
  }

  ngOnDestroy() {
    if (this.removeClickListener) {
      this.removeClickListener();
    }
    this.productsSub?.unsubscribe();
  }

  navigateToCreate() {
    // Desenfoca el elemento activo para evitar warnings al ocultar la página
    const activeEl = document.activeElement as HTMLElement | null;
    activeEl?.blur();

    // Opcional: cerrar el buscador si está abierto
    this.cerrarBusqueda();

    this.productsState.setMode('create');
    this.productsState.setProductId(null);
    this.productsState.setType(this.currentType || 'general');

    this.router.navigate(['/products/formproduct']);
  }

  editProduct(product: any) {
    // Desenfoca el elemento activo para evitar warnings al ocultar la página
    const activeEl = document.activeElement as HTMLElement | null;
    activeEl?.blur();

    // Opcional: cerrar el buscador si está abierto
    this.cerrarBusqueda();

    this.productsState.setMode('edit');
    this.productsState.setProductId(product.uid);
    this.productsState.setType(product.type);

    this.router.navigate(['/products/formproduct']);
  }

  async softDeleteProduct(product: Product) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `¿Deseas desactivar el producto "${product.product_name}"?, esta accion se puede revertir`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          handler: () => {
            this.productsService.softDeleteProduct(product.uid).then(() => {
              this.loadProducts();
              this.loadingService.show();
              setTimeout(() => {
                this.loadingService.hide();
              }, 500);
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async restoreProduct(product: Product) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `¿Restaurar el producto "${product.product_name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Restaurar',
          handler: () => {
            this.productsService.restoreProduct(product.uid).then(() => {
              this.loadProducts();
              this.loadingService.show();
              setTimeout(() => {
                this.loadingService.hide();
              }, 500);
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async hardDeleteProduct(product: Product) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `¿Eliminar permanentemente el producto "${product.product_name}"? Esta acción no se puede revertir.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => {
            this.productsService.hardDeleteProduct(product.uid).then(() => {
              this.loadProducts();
              this.loadingService.show();
              setTimeout(() => {
                this.loadingService.hide();
              }, 500);
            });
          }
        }
      ]
    });

    await alert.present();
  }

  isHardware(p: Product): p is HardwareProduct {
    return p.type === 'hardware';
  }
}
