import { AfterViewInit, Component, OnInit } from '@angular/core';
import { SessionService } from '../../../services/session.service';
import { register } from 'swiper/element/bundle';

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

  constructor(private sessionService: SessionService) {}

  async ngOnInit() {
    // Cargar el estado de sesión real para menu/role/pages
    this.loading = true;
    this.session = await this.sessionService.getSession();
    this.role = this.session?.role || null;
    this.loading = false;
  }

  ngAfterViewInit() {
    register();
  }

}
