import { Component, ElementRef, OnDestroy, Renderer2, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonInput } from '@ionic/angular';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: false
})
export class ProductsPage implements OnDestroy, OnInit {
  searchActive = false;
  private removeClickListener: (() => void) | null = null;

  @ViewChild('searchInput', { read: IonInput }) searchInput!: IonInput;
  @ViewChild('header') headerRef!: ElementRef<HTMLElement>;
  products: any[] = [];      // Los productos visibles en la UI
  allProducts: any[] = [];   // Todos los productos (base sin filtro)

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Carga todos los productos al iniciar (de tu servicio, Firestore, etc.)
    this.loadProducts();

    // Escucha los cambios de los query params (?type=)
    this.route.queryParams.subscribe(params => {
      const type = params['type'];
      if (type && this.allProducts.length) {
        this.products = this.allProducts.filter(p => p.type === type);
      } else {
        this.products = [...this.allProducts];
      }
    });
  }

  // Simulación: reemplaza esto por tu método real para traer productos
  loadProducts() {
    // Aquí debes usar tu servicio de Firestore para traer todo
    this.allProducts = [
      { product_name: 'Laptop ABC', type: 'laptop', category: 'Electronics', subcategory: 'Laptops', price: 1000, description: '', imageUrl: '' },
      { product_name: 'Desktop XYZ', type: 'desktop', category: 'Electronics', subcategory: 'Desktops', price: 1200, description: '', imageUrl: '' }
      // ...
    ];
    this.products = [...this.allProducts];
  }

  activarBusqueda() {
    this.searchActive = !this.searchActive;

    if (this.searchActive) {
      // Espera hasta el próximo ciclo para asegurar que el input ya está visible/renderizado
      setTimeout(async () => {
        // IonInput expone getInputElement() que retorna una Promise del input nativo
        const nativeInput = await this.searchInput.getInputElement();
        nativeInput.focus();
      });

      // Agrega listener al documento para cierre por click fuera
      this.removeClickListener = this.renderer.listen('document', 'mousedown', (event) => {
        if (
          this.headerRef &&
          !this.headerRef.nativeElement.contains(event.target as Node)
        ) {
          this.cerrarBusqueda();
        }
      });
    } else {
      this.cerrarBusqueda();
    }
  }

  cerrarBusqueda() {
    this.searchActive = false;
    // Limpia el contenido del input
    setTimeout(async () => {
      if (this.searchInput) {
        this.searchInput.value = '';
        const nativeInput = await this.searchInput.getInputElement();
        nativeInput.blur();
      }
    }, 0);

    // Remueve el listener de clicks externos si existe
    if (this.removeClickListener) {
      this.removeClickListener();
      this.removeClickListener = null;
    }
  }

  ngOnDestroy() {
    if (this.removeClickListener) {
      this.removeClickListener();
    }
  }
}
