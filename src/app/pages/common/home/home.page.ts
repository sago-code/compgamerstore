import { AfterViewInit, Component, OnInit } from '@angular/core';
import { SessionService } from '../../../services/session.service';
import { register } from 'swiper/element/bundle';
import { ProductsService } from 'src/app/services/firebase/products/products.service';
import { Product } from 'src/app/models/product.model';

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

  constructor(private sessionService: SessionService, private productsService: ProductsService) {}

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
  }

}
