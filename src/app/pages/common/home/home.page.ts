// HomePage class
import { AfterViewInit, Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { SessionService } from '../../../services/session.service';
import { register } from 'swiper/element/bundle';
import { ProductsService } from 'src/app/services/firebase/products/products.service';
import { Product } from 'src/app/models/product.model';
import { CartService } from 'src/app/services/firebase/cart/cart.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, AfterViewInit {

  loading = true;
  role: string | null = null;
  session: any = null;
  lastProducts: Product[] = [];

  @ViewChild('promoSwiper', { read: ElementRef }) promoSwiper?: ElementRef;
  @ViewChild('productsSwiper', { read: ElementRef }) productsSwiper?: ElementRef;

  constructor(
    private sessionService: SessionService,
    private productsService: ProductsService,
    private cartService: CartService
  ) {}

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

  async ngOnInit() {
    // Cargar el estado de sesión real para menu/role/pages
    this.loading = true;
    this.session = await this.sessionService.getSession();
    this.role = this.session?.role || null;
    try {
      this.lastProducts = await this.productsService.getLastTenProducts();
    } catch (err) {
      console.error('Error cargando últimos productos:', err);
    }
    this.loading = false;
  }

  ngAfterViewInit() {
    register();

    // Breakpoints para el carrusel de productos
    const productBreakpoints = {
      0: { slidesPerView: 1 },
      480: { slidesPerView: 2 },
      768: { slidesPerView: 3 },
      1024: { slidesPerView: 4 },
      1280: { slidesPerView: 5 },
      1536: { slidesPerView: 6 },
    };

    // Productos: aplicar breakpoints y espaciamiento
    const productsEl = this.productsSwiper?.nativeElement;
    if (productsEl) {
      productsEl.breakpoints = productBreakpoints;
      productsEl.spaceBetween = 12;
      productsEl.initialize?.(); // init="false" en HTML
    }

    // Ofertas: solo espaciamiento (bundle ya trae navegación y paginación)
    const promoEl = this.promoSwiper?.nativeElement;
    if (promoEl) {
      promoEl.spaceBetween = 12;
      promoEl.initialize?.(); // init="false" en HTML
    }
  }

}
